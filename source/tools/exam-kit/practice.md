# 猜題方向與變體練習

這些是根據材料設計的練習，**不是正式題目預測結果**。優先順序代表與材料接近、練習可遷移性高，不代表出題機率。

要計時作答並實際評分，使用 [模擬上機考 A 卷](mock-exams/set-a/)：4 題、120 分鐘、100 分，附可執行骨架與公開驗收器；參考解法在獨立頁面。

## 1. 準備優先順序

| 優先 | 能力／可能題型 | 證據 | 什麼情況才繼續深入 |
|---|---|---|---|
| A | ROS 資料流、補 pub/sub、黑箱觀察 | 今年 section2-1 明確涵蓋 | 基礎單筆通後練自訂 message／ID |
| A | 共享狀態正確性、縮短鎖範圍 | 今年 critical-section | 再延伸多核心／IRQ，依現場平台 |
| A | 搬運筆數、fill/copy、完成同步 | 今年 transfer-engine | 拿到實際 SDK 後練 DREQ／FIFO |
| A | PIO 移位、FIFO、程式與設定配合 | 今年 demo_pio.pio、RP2350 連結 | 無板子先做狀態追蹤，不假裝硬體跑通 |
| B | ISA 編碼／解碼、立即數／PC | 今年 RISC-V 手冊連結、位元練習 | 先熟悉格式查表，不背整套 ISA |
| B | 正確率門檻下的吞吐優化 | 歷屆評分、今年鎖與搬運背景 | 正確性建立後再練 |
| B | 自訂資料格式、ID、序列化、演算法移植 | 歷屆 README | 以新題格式為準，先寫純函式 oracle |
| C | CRC sniffer／PIO+DMA pipeline 等綜合題 | 今年硬體線索＋歷屆 CRC，只能推測 | A 類順暢後再做 |
| C | 特定 MNIST／SHA-1／CRC32／多 ESP32 題目重現 | 只有歷屆明確出現 | 沒有今年新證據時不優先背實作 |

## 2. 練習方法

先讀題卡與輸入資料，自己選[短卡](prompts/)、收集資料、讓模型幫忙，再展開提示。完整skill供查閱；預設不全文貼入。
在自己的副本練習，原始 demo 保留作對照。計時包含選技能、貼資料、執行與回報；不是只算寫碼速度。
答對之外，記錄「模型是否要求正確上下文」「是否發明 API」「是否給可執行驗證」。

依最新公告模擬：使用聊天介面、停用上傳與agent工具，自己複製片段與執行命令。練習中刻意重開一次對話，用交接卡接續；不要把自訂練習長度當成官方上限。

### P1｜不靠猜測修好 ROS topic 錯字（15 分鐘，可跑）

環境：本 demo Docker。複製 `processor.py` 為 `processor_practice.py`，將其 INPUT_TOPIC 改為 `/numbers`，執行此副本與原 publisher。
任務：只能先看 CLI，找出為什麼 `/double` 沒資料；確認後再改副本。

交付：觀察指令、資料流圖、最小修改、`21→42` 單筆驗收。

<details><summary>提示與驗收</summary>

用 S2。`topic list -t` 會分別出現 `/number`、`/numbers`；兩端分別只有 publisher／subscriber。node info 能指認各自連線。
修正名稱後停原 publisher，先開 `/double` echo，再 CLI 發21。應得42；再測0、-5。
若只改 QoS、重建 image 或重裝 ROS，沒有針對已知證據。

</details>

### P2｜同名同型別，卻收不到（10 分鐘，診斷）

提供：publisher 在 `/sensor`，message=`std_msgs/msg/Int32`，QoS best-effort/volatile；subscriber 同名同型別，QoS reliable/volatile。兩個 node 均存活，上游持續發送。
任務：解釋阻斷點，提出符合題意的相容配置與驗證方法。題目要求可以容忍偶爾遺失，優先最新資料。

<details><summary>提示與驗收</summary>

用 S2。best-effort offer 無法滿足 reliable request。在這個題意下把 subscriber 調為相容的 best-effort 是合理選項。
先以現場 `topic info -v` 確認實際設定；命令選項查 `--help`。驗收仍要看到連續輸入與輸出，不能以 endpoint count 作完成證據。

</details>

### P3｜補自訂 message callback（20 分鐘，規格練習）

假想 message：輸入有 `uint32 id`、`int32[] values`，輸出有 `uint32 id`、`int64 sum`。每包最多1024個值，可為空。要求每個輸入 ID 對應一個輸出。
任務：先列還需要哪些 package/type／骨架資訊，再設計 callback 與測例。不要假造已存在的 ROS package。

<details><summary>提示與驗收</summary>

S0→S2，純運算可交 S7。需要實際 type 名、topic、初始化、可改路徑、host/板端、sequence 記憶體管理方式。
測 `(id=7, [])→(7,0)`，`(8,[1,-2,3])→(8,2)`。1024個 int32 的總和可由 int64 表示。
多筆 ID 不應被後一包覆寫；若背景處理借用 message pointer，要補所有權設計。

</details>

### P4｜看似有鎖，仍不是正確程式（15 分鐘，可編譯參考）

材料：`examples/unclassified/demo/section2-3/critical-section/main.c`（相對於 exam-kit）。
任務：列出所有共享可變狀態，解釋短鎖版本的問題，保留重計算在鎖外並修正。

<details><summary>提示與驗收</summary>

用 S5。counter 被鎖，但 sink 在多 worker 間未同步。可每 worker 有 local checksum，join 後合併；counter 仍用同一鎖。
參考 [pthread_counter.c](examples/pthread_counter.c)：counter=40000，combined checksum 應等於單執行緒參考。
「多跑十次都對」只是測試證據，還要指出所有權／lock／join 的同步理由。

</details>

### P5｜搬運單位與填值（15 分鐘，主機 demo 可跑）

需求：複製8個 uint32_t；接著用0xA5A5A5A5填滿8個 uint32_t。
錯誤描述：copy 的 count=32；fill 的 src_increment=true。另有第五個 claim 回-1仍繼續 configure。
任務：逐個找錯，列正確工作描述、資源不足政策與驗收。不執行會真正越界的錯誤程式。

<details><summary>提示與驗收</summary>

用 S6。copy count=8、size=XFER_32、兩端遞增；fill count=8、source固定、destination遞增；-1不能 configure。
等待／排隊／回報失敗由題意決定。固定來源 pattern 活到 wait 完成。
本 demo `make mistake` 用較大配置展示超過預定區的寫入，可用來理解單位；不代表正式程式可以越界。
驗收每個元素、目標區後 sentinel、連續兩輪；library 的同步瑕疵仍需理解，不能稱跑通就完全 thread-safe。

</details>

### P6｜PIO echo 少了哪些條件（20 分鐘，無板可推導）

程式：`out x,32; in x,32; push`，wrap 循環。CPU 開 autopull=true、threshold=32，autopush=true、threshold=32；TX/RX 都可用。
任務：分析為何可能收到預期資料後又收到一筆額外資料，給最小設定修正與連續測試。

<details><summary>提示與驗收</summary>

用 S4。`in x,32` 已觸發 autopush，又遇 explicit push，應分析額外 push 與 ISR reset，不可只改 OUT shift direction。
若保留 explicit push，可停用 autopush。確認初始狀態、wrap/offset/enable，再送0x12345678、0x89ABCDEF。
期待每次送一個 word 只回一個同值 word。無硬體時只標記推導，不標硬體已驗證。

</details>

### P7｜RISC-V 立即數與位址（10 分鐘，主機可算）

限定標準32-bit RV32I、little-endian 表示法。
1. 編碼 `addi x1,x0,-1` 並列記憶體 bytes。
2. 分支指令位於PC=0x100，目標0xFC。`beq x1,x2,target` 的 byte offset 是多少？編碼為何？

<details><summary>提示與驗收</summary>

用 S3。ADDI word=0xFFF00093、bytes=`93 00 F0 FF`。
BEQ offset=-4，以當前PC為基準；word=0xFE208EE3，bytes=`E3 8E 20 FE`。
不要以PC+4作基準，或組合含bit0=0的offset後再額外乘2。正式驗證最好加目標工具鏈反組譯；本包只核對欄位算術。

</details>

### P8｜相同數值，不同 hash（15 分鐘，可跑）

規格：三個 int32 以little-endian連接，不含padding、ID或NUL，再算SHA-1與標準CRC-32/ISO-HDLC。
輸入 `(1,-2,3)`。某實作直接 hash 整個含ID與padding的C struct。
任務：先印出雙方bytes，定位差異，再修序列化；不得先換hash演算法。

<details><summary>提示與驗收</summary>

用 S7。正確12 bytes是`01 00 00 00 FE FF FF FF 03 00 00 00`。
在 `exam-kit/` 執行 `python3 examples/wire_oracle.py 1 -2 3` 取得參考。先用`123456789`核對CRC變體，才能採用zlib值。
SHA-1輸出20 bytes，不是40-byte ASCII hex。題目若改CRC變體，這個oracle必須跟著變。

</details>

### P9｜調快不一定得分（10 分鐘，數據判讀）

假想門檻：100筆至少95筆正確才給效能分。
A：100筆正確／2秒；B：90筆正確／1秒；C：100筆正確／1.5秒。三者使用相同計時邊界。
任務：選版本、指出下一個優化該量什麼，不許只挑「完成最快」。

<details><summary>提示與驗收</summary>

用 S8。B未過門檻；A有效吞吐50/s，C約66.67/s，C在這些資料下較佳。
後續需分段量測與確認波動，不可由總時間直接斷定瓶頸在DMA或CPU。

</details>

### P10｜綜合：一開始正確，連發就錯（25 分鐘，設計題）

假想資料流：ROS callback收到陣列→把message內的pointer交給背景worker→DMA搬運→PIO處理→publish結果。
單筆正確，連續100筆時出現重複ID與錯位資料。
任務：畫buffer所有權與完成時序，提出觀察點，先修正確性再考慮雙buffer。

<details><summary>提示與驗收</summary>

S0拆解→S2確認input/ID→S5查callback借用buffer重用→S6查DMA完成→S4查FIFO筆數→S7比結果。
不要一開始把所有skills都貼入。先建立已接收／排隊／處理／完成的ID與buffer追蹤。
需要明確的FREE→FILLING→IN_FLIGHT→DONE→FREE所有權轉移；哪些狀態可被CPU、DMA、worker讀寫要寫清楚。
雙buffer是可能方案，不是自動正確：buffer不足時要按題目等待／背壓／回報，不能覆寫尚未完成資料。

</details>

## 3. 90分鐘模擬操作

10分鐘 S0讀題與找檔 → 20分鐘P1/P2 → 15分鐘P4 → 15分鐘P5 → 15分鐘P6 → 10分鐘P9 → 5分鐘回顧。
記錄每次失敗是「不知貼什麼」「模型沒遵循」「指令操作不熟」還是「規格不清」。優先修這些流程問題，比增加更多篇筆記有效。
