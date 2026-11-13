# 模擬上機考 A 卷：資料接收、搬運與驗證

**時間 120 分鐘，滿分 100。** 這些分數、容量與時間均為本卷練習規格，不是正式考場規則。

## 作答規則與準備

| 題號 | 主題 | 分數 | 建議時間 |
|---|---|---|---|
| Q1 | ROS 診斷＋訊息純運算 | 自動 20＋人工 10 | 30 分鐘 |
| Q2 | C 搬運描述與生命週期 | 自動 20＋人工 5 | 30 分鐘 |
| Q3 | PIO 與非同步 buffer 診斷 | 人工 25 | 30 分鐘 |
| Q4 | RV32I 分支解碼＋效能判讀 | 自動 15＋人工 5 | 20 分鐘 |
| 整理 | 重開對話交接、回歸與保存 | 不另計分 | 10 分鐘 |

可用本包短卡、官方文件、指定的練習模型。程式必須對規格成立，不能依案例、呼叫順序或測試名稱回傳硬編答案。

所需環境：Python 3.9+，`cc` 或 `gcc` 支援 C11。驗收器只用 Python 標準庫；C 題不需要 pthread、ROS 或 Pico SDK。

本卷已附 **`exam-kit/mock-exams/set-a/work/`** 作答目錄，直接編輯其中三份檔案即可。以下命令都在 **`exam-kit/mock-exams/set-a/`** 執行。

- 待完成：[work/packet.py](work/packet.py)、[work/transfer.c](work/transfer.c)、[work/branch.py](work/branch.py)。
- 原始骨架備份：[packet.py](starter/packet.py)、[transfer.c](starter/transfer.c)、[branch.py](starter/branch.py)。
- 唯讀介面：[transfer.h](support/transfer.h)。
- 唯讀驗收：[judge.py](judge.py)、[C harness](support/transfer_check.c)。

Linux／WSL Bash：

```bash
python3 judge.py --work work --cc gcc
```

Windows PowerShell（Python 指令通常為 `python`）：

```powershell
python judge.py --work work --cc gcc
```

`starter/` 保留原始骨架；想重新作答時，複製到另一個目錄並用 `--work` 指定，避免覆寫現有答案。編譯器不在 PATH 時，以 `--cc "完整編譯器路徑"` 指定。編譯／執行產物放系統暫存目錄；作答目錄內只需要三份答案。

初始骨架預期 **0/55 自動分**，exit=1；全部自動通過為 55/55、exit=0。人工 45 分另外評，不因自動全過直接算 100。可單題執行：

```bash
python3 judge.py --work work --only q1
python3 judge.py --work work --only q2 --cc gcc
python3 judge.py --work work --only q4
```

## Q1：訊息到了嗎？（30 分）

### Q1-A｜ROS 固定診斷資料（10 分，文字作答）

以下是**題目構造的觀察資料**，不是本包宣稱已執行的 ROS 日誌。環境是 host ROS 2；兩個 node 都存活，publisher 持續發送，沒有第三個發布者。

```text
/feeder -> /batch_input : practice_msgs/msg/Batch
  publisher QoS: best_effort / volatile / keep_last depth=10
/processor -> subscribes /batch_inputs : practice_msgs/msg/Batch
  subscription QoS: reliable / volatile / keep_last depth=10
/processor -> publishes /batch_output : practice_msgs/msg/BatchResult

topic /batch_input:  Publisher count=1, Subscription count=0
topic /batch_inputs: Publisher count=0, Subscription count=1
topic /batch_output: Publisher count=1, echo 收不到資料
```

已提供的介面：

```text
# practice_msgs/msg/Batch
uint32 id
int32[] values

# practice_msgs/msg/BatchResult
uint32 id
int64 sum
uint32 crc32
uint16 byte_count
```

規格允許傳輸偶爾遺失；低速單筆驗收時必須核對收到的 ID 與結果。**只允許改 processor 的訂閱 topic 與 QoS**，不能改 feeder、message 或把 type 換成 Int32。

交付：

1. 依資料指出需要處理的阻斷條件與最小設定修改。
2. 列出修改後的 CLI 觀察、三個終端啟動順序、單筆驗收內容。
3. 說明為何「publisher count=1」還不是完成證據。

### Q1-B｜純函式 `handle(message)`（20 分，自動）

可改 `work/packet.py`，不接 ROS、不讀外部檔案、不修改輸入。可使用 Python 標準庫。

輸入是 dict，且恰有 `id`、`values` 兩個 key：

- `id`：0～4294967295 的 Python int，bool 不算 int。
- `values`：list，長度 0～64，每項是 -2147483648～2147483647 的 int，bool 不算。
- 任一條不符合，一律 `raise ValueError`，不是靜默截斷、回傳 None 或改寫輸入。

回傳恰有以下 key 的 dict，數值皆為 int（不含 bool）：

| key | 規則 |
|---|---|
| `id` | 原 ID |
| `sum` | 所有值的數學總和，不能用 int32 截斷 |
| `byte_count` | 每項 4 bytes，長度為 4×筆數 |
| `crc32` | 原順序 int32 的 little-endian bytes，採 CRC-32/ISO-HDLC，結果為 unsigned uint32 |

CRC 參數：poly=0x04C11DB7、init=0xFFFFFFFF、refin/refout=true、xorout=0xFFFFFFFF；ASCII `123456789` 的 check=0xCBF43926。bytes 不含 ID、長度、padding 或 NUL，不先排序。空資料的 sum、byte_count、crc32 均為 0。

公開範例：

```text
輸入 {"id":7,"values":[1,-2,3]}
bytes 01 00 00 00 FE FF FF FF 03 00 00 00
輸出 {"id":7,"sum":2,"crc32":2763130342,"byte_count":12}
```

評分為 5 組各 4 分：ID／一般結果、總和邊界、序列化／CRC、空與最大長度、不合法輸入／不改輸入。每組全部案例通過才得該組分數。

## Q2：搬運工作描述（25 分）

### Q2-A｜完成 C 函式（20 分，自動）

可改 `work/transfer.c`；介面以 `support/transfer.h` 為準。不可改 header、harness 或自行搬運資料。這是 **host 模擬 job 描述器**，不是 Pico SDK。

實作 `plan_copy` 與 `plan_fill`，填入 `job_t`：

- copy：複製 `n` 個 uint32；來源與目的容量都以**元素數**傳入。
- fill：將 `*pattern` 填入目的的 `n` 個 uint32；pattern 指向一個元素。
- 成功回 0，填好 src、dst、count、size、兩端 increment。規格只允許 `XFER_32`。
- `out`／必要 buffer／pattern 為 NULL、n=0、或容量不足：回 -1。若 out 非 NULL，其內容必須保持原樣。
- 所有非 NULL buffer 由 caller 保證有效、對齊、來源與目的不重疊。不要另外發明題目沒有提供的 allocator 或 channel API。
- 函式本身只描述工作，不改 src、dst、pattern。不要把 pattern 複製到函式區域變數後回傳該區域位址。

唯讀 harness 會先核對描述的欄位與容量，再用主機 copy loop 模擬搬運；錯誤描述不會直接被拿去越界執行。它不模擬 DREQ、非同步或硬體時序。

4 組各 5 分：copy、fill、拒絕非法工作且 out 不變、連續兩輪不同資料／pattern 與 sentinel。

### Q2-B｜非同步生命週期（5 分，文字作答）

假設正式平台提供 `claim → configure → start → wait → release`，claim 可回 -1。說明：

1. 何時可讀目的、修改來源、重用 pattern 或 release？
2. 資源不足要怎麼處理，哪些 API 不能繼續呼叫？
3. 本題主機驗收不能證明哪些硬體／同步性質？

## Q3：一次正確，連發就亂（25 分，文字作答）

### Q3-A｜PIO 每個 TX word 只回低 8 bits（15 分）

需求：CPU 每寫入一個 uint32，PIO 只取其低 8 bits，回傳一個**高 24 bits 為零**的 RX word。TX/RX 都可用，PIO program offset／wrap／init／enable 已確認正確，無 GPIO／DMA。

目前程式與設定：

```pio
.program sample
.wrap_target
    out x, 8
    in x, 8
    push block
.wrap
```

```c
sm_config_set_out_shift(&c, true, true, 32);  // right, autopull
sm_config_set_in_shift(&c, true, true, 8);    // right, autopush
sm_config_set_fifo_join(&c, PIO_FIFO_JOIN_NONE);
```

從 reset 後送 `0x11223344`，CPU 持續排空 RX。要達成的結果只有 `0x00000044`；再送 `0xAABBCCDD`，只回 `0x000000DD`。

可改 `.pio` 與上述 shift 設定，但不得改 CPU 輸入格式或用 CPU 篩掉多餘輸出。

交付：找出筆數與位元位置問題；寫出修改後 `.pio` 與兩項 shift 設定；列前兩個 word 的狀態追蹤，以及連續超過 FIFO 容量的驗收方式。只分析，不宣稱硬體實測通過。

### Q3-B｜背景 worker 借用了誰的資料？（10 分）

以下是生命週期示意，不是可直接編譯的 SDK API。`rx.values` 是接收系統重用的陣列；`queue_push` 只按值複製 Job，worker 稍後才執行。

```c
typedef struct { uint32_t id; size_t n; const int32_t *data; } Job;
void callback(const Packet *rx) {
    Job job = {rx->id, rx->n, rx->values};
    queue_push(job);
}
// worker: 讀 job.data、計算、以 job.id 回傳
```

固定交錯：收到 `(id=101, [3])` 並 enqueue；接著同一接收 buffer 被改成 `(id=102, [9])` 並 enqueue；最後 worker 才處理第一個 Job。

每包最多 8 個 int32，最多準備 2 個自有工作 slot。slot 用完時，規格要求在接受工作前回報 BUSY，不能靜默覆寫或無限加 RAM。

交付：指出第一個 Job 可能算到的資料；畫 callback／worker 的所有權狀態；提供不依賴虛構 SDK 的偽碼，處理容量、完整 payload 複製、發布完成與回收時機。說明兩執行緒間如何同步。

## Q4：分支與有效吞吐（20 分）

### Q4-A｜`decode_beq(word, pc)`（15 分，自動）

可改 `work/branch.py`。只處理**無 C 擴充的標準 RV32I 32-bit BEQ**，假設分支條件成立。

- word、pc 都是 0～0xFFFFFFFF 的 int，bool 不算。
- pc 必須 4-byte 對齊。word 低 7 bits opcode=0x63、funct3=0 才是本題接受的 BEQ。
- 依 B-type 重組有符號 byte offset；target 使用 RV32 的 32-bit 地址環繞。
- target 也必須 4-byte 對齊；其他輸入一律 `raise ValueError`。
- 回傳恰有 `rs1`、`rs2`、`offset`、`target` 四個 int key。

公開範例：`word=0x00208463, pc=0x100` → `rs1=1, rs2=2, offset=8, target=0x108`。

3 組各 5 分：已知向量與暫存器、有號邊界／地址環繞、非法指令／型別／對齊。組譯器不是本題必要依賴，不能把主機算術驗證寫成已在 RISC-V 執行。

### Q4-B｜哪個版本值得保留？（5 分，文字作答）

同一組 120 筆、相同計時邊界，**至少 118 筆正確**才有效能分。有效吞吐=正確筆數／端到端秒數。

| 版本 | 送出 | 收到結果 | 正確 | 秒數 |
|---|---|---|---|---|
| A | 120 | 120 | 120 | 2.4 |
| B | 120 | 120 | 114 | 1.2 |
| C | 120 | 119 | 119 | 1.7 |

選一版，列門檻判斷與有效吞吐，提出下一個有證據需求的單一實驗及回退標準。不得只看完成時間，也不能直接宣稱瓶頸在 DMA。

## 最後交付

三份 `work/` 程式、Q1-A／Q2-B／Q3／Q4-B 的文字答案、驗收原始輸出、一次交接摘要，以及 [實測紀錄](../session-log/)。

做完再開 [人工評分與參考解法](solutions/)。自動測試是公開功能樣本，不是防作弊系統，也不能取代可改範圍與同步推理的人工檢查。
