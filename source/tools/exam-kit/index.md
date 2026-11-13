# 上機考 Cheatsheet：看到什麼，就交給模型什麼

你已熟悉 C 位元運算；本表重點是環境、資料流、硬體設定、同步與驗收。

**操作：選下面一列 → 打開短卡 → 填入本小題資料 → 貼給考場模型 → 你執行一個驗證。**
2026-11-10依使用者提供的公告更新：網頁聊天、無檔案上傳、單次貼文與對話有長度限制，模型名稱不公開。完整skills供查閱，預設不整份貼入；未知欄位填「未知」。

- [短卡總索引](prompts/)／[分段與重開對話](chat-workflow)
- [紙本速查版](print-quickstart)／[公告與規則](exam-rules)
- [使用說明／技能索引](README)
- [RP2350／Pico SDK／ROS 2查詢導覽](docs-guide)
- [官方網站、搜尋詞、來源與勘誤](references)
- [有依據的猜題與變體練習](practice)
- [模擬上機考：題目、作答骨架與評分](mock-exams/)
- [考場程式模板：按題型複製與修改](examples/)
- [模型校準案例](calibration)／[實用性檢查與待辦](readiness)

查找時先用本頁 `Ctrl-F` 搜尋現象，再進對應短卡或模板。本部落格的全站搜尋目前只索引文章，這組工具頁請使用頁內搜尋與索引。

## 0. 現場分流表

| 你看到什麼 | 你先取得什麼，貼給模型 | 短卡／完整詳解 | 成功的證據／失敗後往哪走 |
|---|---|---|---|
| 剛拿到題目，不知先做哪一部分 | 本小題需求、評分條件、可改路徑、相關檔案與啟動說明 | [S0 短卡／詳解](skills/ncku-exam-triage/#短提示卡) | 得到輸入→處理→輸出圖、最小得分路徑、第一個可驗證任務 |
| 看不懂一段程式、指標或 callback，想逐步追值 | 語言、片段與宣告、呼叫端、想理解的部分、一筆輸入 | [S9 程式解讀](skills/ncku-code-reading/#短提示卡) | 能說明輸入／輸出、分支、資料變化與副作用；有明確差異再進 S10 |
| 程式能跑但例外／卡住／結果錯，原因尚未定位 | 需求與預期依據、最小輸入、實際輸出／traceback、目前程式與呼叫順序 | [S10 分析 Debug](skills/ncku-debug-analysis/#短提示卡) | 找到第一個偏離點，給最小修正或能區分原因的觀察；領域明確後轉專門卡 |
| `command not found`、import/header 錯、編譯或燒錄失敗 | 終端種類、`pwd`、執行指令、第一個錯誤及前後文、建置設定節錄 | [S1 短卡／詳解](skills/ncku-build-debug/#短提示卡) | 原指令成功；進程能啟動後才進 S2 |
| ROS node 不見、topic 無資料、callback 沒動作 | 相關 `node list`、`topic list -t`、`node info`、`topic info -v`、啟動日誌 | [S2 短卡／詳解](skills/ncku-ros-dataflow/#短提示卡) | 已知輸入得到對應輸出；有資料但答案錯→S7 |
| 要補 ROS publisher/subscriber 或 micro-ROS callback | 本小題、相關初始化與callback、真實 `.msg`／`interface show`、ID 規則 | [S2 短卡／詳解](skills/ncku-ros-dataflow/#短提示卡) | node/topic/type/QoS 正確，單筆端到端通過 |
| ISA 編碼、立即數、分支 offset、二進位格式 | 格式圖文字、架構／擴充、輸入表示法、PC、預期結果 | [S3 短卡／詳解](skills/ncku-isa-binary/#短提示卡) | 欄位表與獨立案例吻合；涉及完整演算法→S7 |
| `.pio` 組譯失敗、FIFO 卡住、bit 順序錯 | `.pio`、CPU shift/FIFO/wrap/enable與收送片段、晶片／SDK | [S4 短卡／詳解](skills/ncku-pio-state-machine/#短提示卡) | 單 word／連續不同 word 都正確；DMA 接 FIFO 問題→S6 |
| 結果偶發錯誤、多核心卡住、加鎖後變慢 | 共享宣告、各讀寫路徑、thread/core/IRQ 關係、重現方式 | [S5 短卡／詳解](skills/ncku-concurrency/#短提示卡) | 同步依據清楚，重跑結果正確；正確後再進 S8 |
| DMA/engine 越界、只寫一格、永遠 busy、填值錯 | API 宣告、配置／啟動／等待片段、buffer 型別與容量、count/size | [S6 短卡／詳解](skills/ncku-transfer-dma/#短提示卡) | 每個元素正確、尾端 sentinel 不變、完成後才讀取 |
| 能跑但 judge 錯、移植演算法、hash/排序結果不符 | 最小失敗輸入、預期／實際、message／wire 格式、相關函式 | [S7 短卡／詳解](skills/ncku-algorithm-check/#短提示卡) | 獨立參考實作與端到端結果一致；偶發才錯→S5/S6 |
| 正確但慢、提高發送率反而失分 | 評分公式、正確數／送出數／收到數、耗時範圍、基準數據 | [S8 短卡／詳解](skills/ncku-performance/#短提示卡) | 同資料下有效吞吐改善，正確率仍達標 |
| 想找不同解法、現有設計受限或需要突破方向 | 題目硬限制、已確認資源/API、現有方法、已試方案、基準與剩餘時間 | [X1創意發想](prompts/#創意發想) | 選出一個有成立前提與最小實驗的方案，再交對應S卡實作 |

**多種問題同時出現：S0 定義成功 → S1 能建置 → S2 資料通 → S3～S7 算對 → S8 變快。**
任何階段看不懂片段就用 S9；有錯誤但根因未明就用 S10，帶定位結果回對應領域卡。
不用先蒐集整張表所有資料；只蒐集目前那一列。第一次送最小相關包，缺什麼再補什麼。
X1用於比較替代設計；已知錯誤有明確日誌時先用對應S卡定位。選定發想方案後一次只驗證一個改動。

## 1. 交接與回報：每一輪都用同一格式

填完短卡末尾的資料包一起貼上。接到模型回答後：

```text
這是上一輪的實際結果，請沿用目前任務：
執行位置／終端：
指令：
結果／第一個錯誤（原文）：
預期 vs 實際：
本輪只改了什麼：
尚未執行的建議：
請給下一個最能區分原因的動作，附「結果 A / B 各代表什麼」。
```

- 模型只給觀念 → 回：「請給可執行的下一步、執行目錄、預期觀察。」
- 模型發明 API → 回：「在我貼的 header 找不到此名稱，請以宣告為準重寫。」
- 同一問題修兩次都沒改善 → 停止加 patch，貼最後可用版本＋最新最小重現，要求重新定位。
- 換主題／開新對話 → 用[交接卡](prompts/#交接模板)帶走「目標、平台、可改路徑、已驗證事實、目前程式、失敗輸入」，不要只貼聊天結論。

## 2. Linux／環境：知道指令應該在哪裡執行

下面是 **Bash／WSL／Linux container** 指令。`YOUR_...` 與 `<...>` 都要替換，不能照字面執行。

| 目的 | 指令 | 怎麼判讀 |
|---|---|---|
| 我在哪裡 | `pwd`、`ls -la` | 確認是題目根目錄，不是另一個資料夾 |
| 找建置與介面檔 | `find . -maxdepth 4 -type f \( -name 'Makefile' -o -name 'CMakeLists.txt' -o -name 'platformio.ini' -o -name '*.msg' \)` | 決定採用哪種建置方式，找實際 message |
| 看某段檔案 | `sed -n '1,160p' path/to/file` | 保留宣告、函式簽名與上下文 |
| 找符號 | `grep -R -n --include='*.h' 'symbol_name' .` | API 以當前環境 header 為準 |
| ROS 工具在哪 | `command -v ros2`、`printenv ROS_DISTRO ROS_DOMAIN_ID RMW_IMPLEMENTATION` | 未顯示變數不等於錯；比較各個進程的環境 |
| 看 Python 來源 | `python3 -c 'import sys; print(sys.executable)'` | 避免用到沒有 ROS 套件的另一個 Python |

### 本專案 demo 的啟動方式

在主機的 `exam-kit/examples/unclassified/demo/`（有 Dockerfile 的那層）執行：

```bash
docker build -t srecruit-demo .
docker run --rm -it --name srecruit-demo -v "$PWD:/demo" srecruit-demo
```

另一個**主機**終端執行：

```bash
docker exec -it srecruit-demo bash
```

進 container 後用 `cd /demo/section2-1` 等絕對路徑，避免重複 `cd` 造成錯誤。
`Ctrl-C` 停止前景程式；`exit` 離開 shell。原本 `docker run` 的 shell 結束會使這個 container 停止。
未掛載的 container 內修改會隨刪除消失；名稱衝突先用 `docker ps -a` 看現況，要加終端用 `exec`。

本 image 有 ROS 2 Jazzy、gcc、make；**沒有 Pico SDK、交叉編譯器、judge**。這不是今年正式環境的完整規格。

### 選對建置工具

- 本 demo：`cd /demo/section2-3` 後 `make`、`make run`、`make mistake`。
- 單一主機 C 檔：`cc -Wall -Wextra file.c -o app`，成功才執行 `./app`；pthread 加 `-pthread`。
- 已有 Makefile/CMake/PlatformIO 的考題：先用題目既有指令，不能以主機 `gcc` 取代韌體建置。
- `pio run` 是 **PlatformIO CLI**；`.pio` 的 **Programmable I/O** 是硬體狀態機語言，兩者名稱相似但不同。
- 只有題目確實採 PlatformIO 才用 `pio run -e YOUR_ENV`；環境名看 `platformio.ini`，序列埠看現場裝置。

## 3. ROS：用已知輸入追資料，而不是猜 callback

本 demo：`/publisher → /number (Int32) → /processor → /double (Int32)`。

```bash
ros2 node list
ros2 topic list -t
ros2 node info /processor
ros2 topic info /number -v
ros2 interface show std_msgs/msg/Int32
```

**單筆測試（本 demo 的精確操作）：**
1. 終端 A：`cd /demo/section2-1`，執行 `python3 processor.py`。
2. 終端 B：先執行 `ros2 topic echo /double`，保持開著。
3. 停掉其他對 `/number` 的 publisher；終端 C 執行：

```bash
ros2 topic pub --once /number std_msgs/msg/Int32 "{data: 21}"
```

應在 B 看到 `data: 42`。再測 `0 → 0`、`-5 → -10`。`echo` 用 `Ctrl-C` 結束。
這個測試確認資料路徑與此轉換；不代表所有邊界都通過。Int32 輸出必須在有號 32-bit 範圍內。

### 常見錯誤與下一步

| 現象／錯誤理解 | 原因候選 | 先做什麼 |
|---|---|---|
| `ros2: command not found` | 未進正確環境／未 source | 查 `command -v ros2`；本 Jazzy image 可 `source /opt/ros/jazzy/setup.bash` |
| node 不存在 | 進程退出、domain／發現設定不同、agent 未連上 | 看啟動日誌與各終端環境；有 micro-ROS 才查 agent |
| topic 存在就代表有資料 | topic 可只有 subscriber | 看 publisher 數與實際 echo |
| `Publisher count > 0` 就代表正在 publish | endpoint 存在不等於 callback/timer 正常 | 看上游 echo、timer／callback 日誌 |
| 名稱／型別一樣仍收不到 | QoS 不相容、送出時訂閱尚未就緒 | 看 `topic info -v`；先開 echo 再送 |
| best-effort publisher 配 reliable subscriber | reliability 不相容 | 依規格調相容 QoS；不要把「全改 reliable」當通用修法 |
| subscriber 數比想像多 | `echo`、`hz`、judge 都可能訂閱 | 對照 endpoint 名稱，計入觀察工具 |
| callback 卡住，其他事件也停 | 單執行緒 executor 被長運算或等待佔住 | 定位阻塞點，先縮短 callback；不要直接增加 threads 掩蓋問題 |
| 多個 subscriber 會自動分攤工作 | topic 是廣播式 pub/sub，通常每個相容 subscriber 都會收到 | 分工需按題目用不同 topic 或應用層分派／ID 規則 |
| `topic hz` 低就一定是 publisher 慢 | CLI 接收、QoS、負載也會影響觀測 | 對照實際計數／時間，不用單一 CLI 數字當 judge |

**rclpy 心智模型：** `init → Node → create_publisher/create_subscription/create_timer → spin → destroy_node/shutdown`。
`create_timer(1.0, callback)` 單位是秒；`create_publisher(..., 10)` 的 `10` 是 queue depth，不是 10 Hz。
原始骨架看 [publisher.py](examples/unclassified/demo/section2-1/publisher.py)／[processor.py](examples/unclassified/demo/section2-1/processor.py)；附邊界檢查的版本見 [ROS 模板](examples/ros2/README)。自訂 message 先查欄位，不能照搬 `Int32.data`。

## 4. PIO：程式與 CPU 設定一定要一起看

```text
CPU 寫 TX FIFO → pull/autopull → OSR → out → X/Y/其他目的
X/Y/pins 等來源 → in → ISR → push/autopush → RX FIFO → CPU 讀
```

PIO 不是 RISC-V CPU：指令集、暫存器與組譯器不同。一般沒有通用資料 RAM，但有指令記憶體、FIFO；同一 PIO block 的狀態機共享 32 個 instruction slots。

| 現象 | 先檢查 |
|---|---|
| `out` 一直等 | TX 是否有資料、autopull 開關／threshold、CPU 是否先卡在等 RX |
| `push` 卡住 | RX 是否滿了、CPU 有沒有讀、FIFO join 是否停用接收方向 |
| echo 多一筆或零資料 | autopush 已送一次，是否又 explicit push；是否有上一輪殘留 |
| 取低 8 bits 卻取到高位 | OSR shift direction；`out` 的 bit 順序與主機 byte order 是不同問題 |
| 程式能組譯但完全不動 | program offset、wrap、SM init／enable、FIFO 使用的 SM 是否一致 |
| GPIO 沒輸出 | pin mapping、pin direction、GPIO function、clock divider |

本 demo 的三指令 echo 假設 autopull；若搭配 explicit `push`，不要無意再開 autopush。
**`autopull` 是依移出 bit 計數與門檻運作，不是測 OSR 數值是否為零。**
不熟時交 S4，要求它先列設定表與逐指令狀態，再給程式。

## 5. 併發：鎖保護「不變條件」，不只某一行

- 共享變數被多個 thread/core 存取且至少一方寫入，要有正確同步。`volatile` 不等於 atomic／mutex／memory ordering。
- 「讀值→計算→寫回」若必須是一個不可分割更新，不能只鎖讀取或只鎖寫回。
- 可在鎖外做的工作，必須不依賴會改變的共享狀態；必要時鎖內 snapshot，鎖外計算，再按一致性要求提交。
- `sink += work(i)` 也是共享更新。demo 的短鎖版本仍有 `sink` race；不要拿它當成完整正確範本。
- thread-local 累積＋join 後合併通常易驗證；但若題目需要即時共享狀態，不能直接套用。
- 單核心仍會排程交錯；「跑一次剛好正確」不能證明無 race。
- thread mutex、硬體 spinlock、IRQ critical section 不能只換函式名。IRQ 中等待同核心被中斷程式持有的鎖可能死鎖；關本核心 IRQ 也不會自動保護另一核心。

可編譯主機範例：[pthread_counter.c](examples/pthread_counter.c)。它示範 mutex 保護 counter、每個 worker 私有 checksum、join 後合併。

## 6. Engine／DMA：先把單位與所有權寫清楚

| 用途 | source increment | destination increment | 補充 |
|---|---|---|---|
| 記憶體 copy | true | true | 驗證來源／目的容量、重疊規則 |
| 固定 pattern fill | false | true | pattern 的型別／大小／生命週期要夠 |
| 記憶體 → 周邊 FIFO | true | false | 真硬體需對應 TX DREQ，固定周邊位址 |
| 周邊 FIFO → 記憶體 | false | true | 真硬體需對應 RX DREQ，固定周邊位址 |

### 本 demo 的規則

`claim → 檢查 ch >= 0 → configure → start → wait → 用結果 → release`

- `count` 是 transfers，總量 `count × 每筆 bytes`。4096 個 `uint32_t` 是 count=4096、size=`XFER_32`，不是 count=16384。
- `XFER_8/16/32` 的 enum 值是 1/2/4；**Pico SDK 的 `DMA_SIZE_8/16/32` enum 值是 0/1/2**。不可直接互換 enum 或用它乘 count。
- 本 demo 禁止 count=0，檢查 1/2/4-byte 對齊，但不檢查 buffer 容量。
- buffer、fill pattern 必須活到完成；啟動後不能提前改來源、讀未完成目的或重用工作區。
- 即使輪詢 `engine_busy()` 結束，也應 `engine_wait()` join 後再取用／重用資源。
- demo 的 `busy` 只是 volatile，並非可靠的跨執行緒同步實作；`claim` 也沒有多呼叫者同步。若題目要求修實作，交 S5。

### 真硬體常見坑

| 現象 | 檢查點 |
|---|---|
| 只剩最後一筆／只有一格變了 | write increment 未開；Pico SDK default 不一定是你要的 copy 設定 |
| 多寫四倍 | bytes 填成 transfers |
| 永遠 busy | DREQ 來源／方向、FIFO 是否有人收送、channel enable、啟動時機 |
| 第一輪對，第二輪錯 | 位址／count 是否重新裝載、buffer 是否仍被上一輪使用 |
| 主機 demo 能跑就照貼 SDK | `engine_*` 是練習 API；真 DMA 請看現場 header，configure 可能是 **dst 在 src 前面** |

RP2350 DMA count 也涉及模式位元；先確認當前 SDK 版本／API，使用該版本的文件，別只複製最新網路範例。

## 7. 能跑但答案錯：先確認傳的到底是什麼

1. 固定一筆輸入與 ID，記錄收到、開始計算、完成、發出四個節點。
2. 切成「解包 → 純運算 → 打包」；先比對純運算，再看端到端。
3. Hash／CRC 先比對輸入 byte stream。struct padding、欄位順序、little/big-endian、字串 NUL、資料長度都可能使結果全錯。
4. 排序先確定比較 key、同值規則、數值範圍。比較器用減法可能溢位；平方和要先推最大值，升型後再乘。
5. 當只有快速連續輸入才錯，查 callback buffer 生命週期、競態、丟包、ID 配對，再想演算法。

位元部分只提醒：shift 範圍、full-width mask、符號延伸、ISA 位元重排、byte order；基礎 AND/OR 不另佔篇幅。
獨立主機參考：[wire_oracle.py](examples/wire_oracle.py)，只對它明訂的 little-endian int32／標準 CRC-32 規格有效。

## 8. 效能與提交

- 先確認題目的正確率門檻與計時範圍；歷屆門檻不能直接套今年。
- 一次只改一件事，記 `版本／變更／送出／收到／正確／耗時／有效吞吐`。
- 發送率不是完成率；先做小幅調整，看正確結果是否增加、有沒有 backlog／丟包。
- 計時要等工作真正完成，不能只量 async start 的時間。保留可回復的正確版本。
- 提交前：可改檔案範圍、接口／ID、邊界案例、實際建置、題目驗證命令、修改是否已保存。

**本包狀態：** 來源審查、程式範例與文件結構檢查結果見 [驗證紀錄](validation)。尚未在考場模型上評測；可先用校準案例確認它能遵循流程。
