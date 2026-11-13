# A 卷：評分細則與參考解法

**作答完成後再看。** 這頁及 `reference/` 會透露解法，不要先貼給受測模型。合理且符合契約的替代解法同樣得分。

[回題目](../)／[實測紀錄](../../session-log/)

## 分數怎麼算

自動 55 分＋人工 45 分＝100。自動每組全過才得該組分數；人工依下列拆分給分。改唯讀檔、改介面或硬編測例的答案，受影響的自動組分數不採計，需恢復原驗收器再測。

驗收器的時間限制（Python 題每題 5 秒、C 編譯 30 秒、C 每組 5 秒）用來避免卡住，不是速度排名，也不是正式考場限制。編譯器缺失、語法錯或 timeout 會顯示原因並讓該部分零分，其餘題仍繼續；不要把環境錯記成模型算法一定不會。

| 部分 | 配分方式 |
|---|---|
| Q1-B | 5 組×4＝20；結果完整 key、整數型別、ID、總和、CRC、長度、合法性與不改輸入 |
| Q2-A | 4 組×5＝20；描述器正確才模擬搬運 |
| Q4-A | 3 組×5＝15；已知向量、編碼生成的變體、邊界與非法輸入 |
| 人工 | Q1-A 10＋Q2-B 5＋Q3 25＋Q4-B 5＝45 |

## Q1 參考

程式：[packet.py](../reference/packet.py)。關鍵是先驗證完整輸入，再序列化；bool 在 Python 是 int 的子類，因此只用 `isinstance(value, int)` 不足以符合本題規格。總和使用 Python int，不能在資料已超 int32 後截斷。

Q1-A 人工 10 分：

| 得分點 | 分數 |
|---|---|
| 指出 `/batch_inputs` 與 `/batch_input` 不同，改 processor 訂閱為後者 | 3 |
| 指出 best-effort offer 不滿足 reliable request；依題意將 processor 訂閱改為 best-effort，保留相容 durability | 3 |
| 提出修改後 `topic info -v`／interface 確認，以及先 processor、再輸出 echo、最後送固定單筆並核 ID／結果 | 3 |
| 說明 endpoint 存在不等於 callback 有執行、連線相容或輸出正確 | 1 |

3 分驗收可拆為：endpoint/schema 查核 1 分、啟動順序 1 分、固定 ID＋正確結果 1 分。只修 topic 而沒處理 QoS 不能拿到 QoS 分。

可執行驗收的命令形式（在有該題套件的 ROS shell，非本卷主機驗收環境）：

```bash
ros2 topic info /batch_input -v
ros2 interface show practice_msgs/msg/Batch
ros2 topic echo /batch_output
```

先用題目啟動命令跑 processor，另一終端保持 echo，再停會干擾的 feeder，第三終端用相容 QoS 發一次：

```bash
ros2 topic pub --once --qos-reliability best_effort /batch_input practice_msgs/msg/Batch "{id: 7, values: [1, -2, 3]}"
```

CLI 選項以現場 `--help` 為準。預期 id=7、sum=2、crc32=2763130342、byte_count=12。本卷未提供真實 `practice_msgs` package，這是題設介面下的驗收計畫，不要直接在原 Int32 demo 宣稱已跑通。

## Q2 參考

程式：[transfer.c](../reference/transfer.c)。先判斷所有錯誤再提交 job，可自然保證失敗時 out 不變。

- count=n，不是 n×4；size=XFER_32。
- copy 的 src/dst 都遞增；fill 的 src 固定、dst 遞增。
- source、destination、pattern 都保存 caller 提供的位址；沒有區域 pattern 的懸空指標。
- 不需要先算 n×4，因此 n=SIZE_MAX 可在容量判斷時拒絕，沒有乘法溢位問題。

Q2-B 人工 5 分：

| 得分點 | 分數 |
|---|---|
| start 後保持 source／pattern／destination 的有效期與所有權，wait 完成後才讀目的、改來源／pattern、重用或 release | 2 |
| claim=-1 時停止 configure/start，按規格排隊／等待／回報，不把 -1 當有效通道 | 1 |
| 主機 harness 只測參數與功能；不證明 DREQ／硬體完成／thread-safe，需另做真實完成與連續測試 | 2 |

## Q3 參考

### PIO（15 分）

原程式至少有三個互相關聯的問題：

1. 一次只 OUT 8 bits、autopull 門檻卻是 32，會從同一 TX word 連續取四個 byte。
2. IN shift-right 8 bits 把新 byte 放在 ISR 的高 8 bits，不是所需低 8 bits。
3. IN 已觸發 autopush，隨後 explicit push 又送一次清空後的 ISR。

在題設 CPU 持續排空 RX 下，第一個 word 可觀察到 `44000000, 00000000, 33000000, 00000000, 22000000, 00000000, 11000000, 00000000`。這是依設定推導，不是硬體實測紀錄。

一種容易驗證的改法是 manual pull/push：

```pio
.program sample
.wrap_target
    pull block
    out x, 8
    mov isr, x
    push block
.wrap
```

```c
sm_config_set_out_shift(&c, true, false, 32);
sm_config_set_in_shift(&c, true, false, 32);
```

關閉 autopull／autopush；每輪 explicit pull 讀一個完整 word，OUT 取低 8 bits 到 X（其餘位補零），MOV 把 X 放入 ISR，PUSH 只送一次。下一輪 pull 取代 OSR 未用的高 24 bits。

| 輸入 | pull 後 OSR | out 後 X | mov 後 ISR | 唯一輸出 |
|---|---|---|---|---|
| 11223344 | 11223344 | 00000044 | 00000044 | 00000044 |
| AABBCCDD | AABBCCDD | 000000DD | 000000DD | 000000DD |

| 得分點 | 分數 |
|---|---|
| 發現同一 TX word 被拆成四次 OUT，以及雙 push 造成多筆 | 3 |
| 解釋 IN shift-right 造成高位放置，指出需零延伸 | 3 |
| 修改後程式與 CPU 設定一致，每個 word 只回一個正確結果 | 5 |
| 兩 word 狀態追蹤、連續超過 FIFO 容量的測試與可停止的 timeout／觀察方法 | 4 |

替代方案例如每輪明確處理剩下 24 bits，也可給分；不能以 CPU 丟棄錯誤結果代替修 PIO。

驗收先一送一收上述兩筆，再送 16 筆不同低 byte；檢查每筆值、總數與無殘留 RX。不要先寫滿 TX 後完全不讀 RX。timeout 必須記錄停在哪個呼叫；未上板時填「推導通過／硬體未測」。

### Buffer（10 分）

第一個 Job 的 id 是值複製，所以仍為 101，但 data 指向被改寫的接收 buffer，可能算到 `[9]`。複製 Job 不等於複製 payload；也不是把指標加 volatile 就能修好。

可用兩個含 `id/n/data[8]/state` 的自有 slot，同一 mutex 保護 state 與 producer/consumer 的交接：

```text
callback(rx)：
  先檢查 n<=8
  lock
  若沒有 FREE slot：unlock，回報 BUSY，這筆尚未接受為工作
  選 slot，標 FILLING，複製 id、n、有效 data[0:n]
  標 READY，unlock                 # 在 callback 返回前完成複製

worker：
  lock，找 READY slot，標 RUNNING，unlock
  只讀自己持有 slot 的資料計算
  用該 slot 的 ID 發布結果
  確認發布端已用完輸出 buffer（失敗依規格記錄／重試，不能冒充成功）
  lock，標 FREE，unlock
```

copy 最多 32 bytes，此解法為了簡單在鎖內複製；運算與阻塞發布在鎖外。mutex 的 release/acquire 交接提供可見性；RUNNING 的 slot 不再由 callback 改寫。若改用 queue／atomic，必須提出同等所有權與記憶體順序理由。

| 得分點 | 分數 |
|---|---|
| 說明 id=101 卻讀到第二包 payload，以及 pointer 淺複製原因 | 2 |
| FREE→FILLING→READY→RUNNING→FREE，持有期間不覆寫，發布用完才回收 | 3 |
| 先驗長度、複製 ID＋有效 payload，明確保護狀態與可見性 | 3 |
| 兩個 slot 滿時在接受前 BUSY，不偷偷覆寫、丟包或無限配置 | 2 |

## Q4 參考

程式：[branch.py](../reference/branch.py)。B-type 組合出的 offset 已含隱含 bit0=0，不能再乘 2；符號位是 bit12。target 以當前 PC 為基準，再截成 32-bit 位址。

額外邊界：pc=0xFFFFFFFC、offset=4 應 target=0；PC=0、offset=-4 應 target=0xFFFFFFFC。offset=2 雖可編碼，但本題限定無 C 擴充且分支成立，target 非 4-byte 對齊，須拒絕。

Q4-B 人工 5 分：

- A：120 正確，達門檻，50 正確/s。
- B：114 正確，未達 118；95 正確/s 不具效能得分資格。
- C：119 正確，達門檻，70 正確/s，應保留 C。
- 下一實驗可先查 C 的一筆缺失發生於發送、接收、計算或發布；量分段時間再選一次小幅調整。使用同資料／同計時邊界，低於 118 或沒有超過波動的改善就回退。不能只因少一筆就斷言 DMA 有問題。

門檻與選版 1 分、三版有效吞吐 2 分、單一有驗收／回退標準的實驗 2 分。

## 檢查驗收器本身

在 `set-a/` 執行（Windows 可把 python3 改為 python）：

```bash
python3 judge.py --work starter --cc gcc
python3 judge.py --work reference --cc gcc
```

預期分別 0/55（exit=1）、55/55（exit=0）。reference 通過只是本卷功能契約的檢查，不代表 Iceman Free、ROS、PIO 或正式 judge 已通過。
