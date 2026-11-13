# 驗證紀錄

初版驗證：2026-11-07；公告適配：2026-11-10；模板驗證：2026-11-11；模擬考更新：2026-11-13。

## 2026-11-13：S9 程式解讀與 S10 分析 Debug

- 新增 `skills/ncku-code-reading/` 與 `skills/ncku-debug-analysis/`，各含 `SKILL.md` 工作規則入口，以及 `index.md` 短卡、詳解、追蹤／除錯案例；考場仍採人工貼文字、執行與回報。
- S9 聚焦理解目前片段：輸入輸出、控制／資料流、變數、副作用、呼叫與生命週期，區分行為與意圖；S10 聚焦預期／實際差異、第一個偏離點、證據與區分實驗、最小修正及回歸。
- 已接入主頁、README、prompts、聊天指南、紙本速查、S0／S1／S7 分流與模擬考入口。使用中短卡編號更新為 S0～S10；早期驗證紀錄仍保留當時的 S0～S8 數量。
- 兩份新 skill 的資料夾／name、front matter、程式碼區塊配對、來源連結與主入口檢查通過。S9／S10 空白短卡分別為 357／361 字元，不含末尾換行與使用者填入資料，並非 token 數或考場上限。
- calibration 新增 C10～C12，檢查不擅改需求、未知 API 不臆測、跨次狀態與回歸。案例與通過標準分開；尚未交由 Iceman Free 或考場模型實測，不宣稱技能效果已獲驗證。

## 2026-11-13：模擬上機考 A 卷

- 新增 `mock-exams/`：120 分鐘、100 分，含 ROS 診斷／訊息處理、C 搬運描述、PIO／buffer 分析、RV32I 解碼／效能判讀。題目、待完成程式、公開驗收器、人工評分細則、參考解法與 Iceman Free 實測紀錄分開。
- 主機自動題共 55 分；其餘 45 分需依文字答案人工評分。ROS／PIO 的診斷資料為題目構造，不是已跑過的硬體日誌。
- Windows、Python 3.13、MSYS2 UCRT64 GCC：`python judge.py --work starter --cc gcc` 得 0/55、exit=1；`--work reference` 得 55/55、exit=0。C 以 `-std=c11 -O2 -Wall -Wextra -Werror` 編譯，產物置於暫存目錄。
- 模擬缺少 C 編譯器時，Q2 明確報錯且零分，Q1／Q4 仍完成，總分 35/55、exit=1。錯誤 ID 與將分支 offset 重複乘 2 的負向對照均被驗收器拒絕。
- 新增 Python 語法、Markdown 程式碼區塊與 20 個來源連結檢查通過。參考解法通過只表示符合本卷公開功能測例，沒有宣稱對任意程式完成形式驗證或防作弊。
- Iceman Free 的實際作答、往返時間、貼文限制與協作品質由使用者測試，紀錄目前留白。本次沒有以任何模型代跑受測作答，也未執行 ROS／PIO／實體板端測試。

## 2026-11-11：整包實用性審查

- 依考場公告核對九份技能、短卡、操作指南、練習與模板；結論與考前待辦見 `readiness.html`。本包可作為靜態查閱／聊天協作資料，完整考場流程尚待實測。
- 找到並修正 13 個來源連結問題、X1／交接卡互指、短卡入口不明、`CMakeLists.txt` 搜尋拼字、demo 位置與舊文件布局說明。
- 實際執行 `npm run build` 發現 Hexo 會將文件輸出為 `.html`，不能以「來源路徑存在」當成網站連結通過。現已改用生成網址，並補 S0～S8 的短卡錨點與 prompts 總索引。
- 第一次 build 日誌顯示歷屆 README 的 YAML 解析錯誤，但命令仍 exit 0。加入明確 front matter 後重新建置，該頁正常產生、日誌無此錯誤；原文缺圖與截斷狀態已註記。
- 27 個使用中 Markdown（不含 unclassified 原始材料）的程式碼區塊配對通過；檢查其生成 HTML 的站內連結、實際目標檔案與錨點，全部通過。以本機 HTTP 逐頁取讀，27 頁均回 200。
- 從生成 HTML 取出 S0～S8、X1、交接卡共 11 個文字區塊，與來源逐字比對通過。S0～S8 為 258～513 字元（不含區塊末尾換行與填入資料）；不是模型 token 數或考場上限。
- 重新以 Windows／MSYS2 UCRT64 GCC 的 `-std=c11 -O2 -Wall -Wextra -Werror` 建置並執行 pthread、頂點、engine 範例；pthread／engine 另加其必要旗標。結果為 counter=40000、checksum=399980000、`vertex checks: PASS`、`engine copy/fill: PASS (2 rounds)`。engine 原 library 的競態限制仍適用。
- Python 語法檢查通過；oracle 正常／空輸入／int32 兩端／超範圍拒絕與 SHA-1、CRC 已知向量通過。ROS transform 的功能檢查沿用同日模板紀錄，未以此替代 ROS 通訊。
- **受阻項目**：`docker info` 回 Docker Desktop Linux engine named pipe 不存在，未執行 ROS 端到端；Tabbit 的啟動與診斷均回 `CLI_REGISTRATION_UNAVAILABLE`，未完成瀏覽器視覺、剪貼簿按鈕或列印預覽測試。HTTP／HTML 驗證不等於這些操作已通過。
- 本次未發布遠端、未測考場模型／正式 judge，未做 micro-ROS／Pico 交叉建置及板端實測，也未重查所有外部網站。下方早期紀錄是歷史結果，不能套用其舊路徑或檔案數作目前驗收。

## 2026-11-11：依 demo／歷屆新增考場模板

- 新增 [examples 索引](examples/)，收錄 ROS 2 發送／處理、micro-ROS 接線、頂點排序／序列化／CRC、engine copy／fill、Pico PIO／DMA 專案，並連到原有 pthread 與 SHA／CRC oracle。每頁附來源、替換欄位與驗收操作。
- Windows／MSYS2 UCRT64 GCC，以 `-std=c11 -O2 -Wall -Wextra -Werror` 編譯 `algorithms/vertex_demo.c`，執行得到 `vertex checks: PASS`。核對已知 bytes／CRC、空輸入、不足容量不寫入、sentinel、同距離與三個 int32 最小值的平方和。
- 同一主機工具鏈加 `-pthread -D_POSIX_C_SOURCE=200809L`，編譯新 `transfer/engine_copy_fill.c` 與原始 demo `engine.c`；執行得到 `engine copy/fill: PASS (2 rounds)`。原始 library 的 busy 資料競爭仍存在，此結果僅為參數與輸出的功能測試。
- Python 3.13：兩份 ROS 模板 AST 語法檢查通過；抽出實際 `transform` 函式測試 21、0、-5、有效邊界與溢位拒絕，全部通過。未使用 mock 假稱 ROS 通訊已通。
- 重跑 `wire_oracle.py 1 -2 3`，bytes／SHA-1／CRC 與文件相符。
- 6 份新 Markdown 的程式碼區塊配對、35 個相對檔案／頁面連結，以及 README／cheatsheet 的模板入口檢查通過。
- 尚未執行 ROS 2 container 端到端、micro-ROS 建置／板端通訊、Pico SDK 交叉建置與 PIO／DMA 實機測試；文件中的硬體 PASS 是預期驗收輸出。

## 2026-11-10：三大文件導覽與創意發想卡

- 確認RP2350 datasheet、Pico SDK、ROS 2已在references收錄；新增docs-guide.md集中官方入口、問題對應搜尋詞、版本核對與摘錄模板。沒有下載完整離線文件，也沒有重新宣稱外部網站取讀成功。
- 新增X1-ideas.txt（空白卡403字元），限最多3個具成立前提、資源需求與最小實驗的方案；補入分流表、聊天指南、紙本速查與C9校準案例。
- 19份使用中的Markdown、102個相對連結、10張任務短卡（S0～S8＋X1）的分流入口，以及三大文件URL存在性檢查通過。
- 這是文件結構與內容審查；X1尚未在考場模型實測，沒有聲稱方案品質或加速效果已驗證。

## 2026-11-10：依公告調整

- 預設入口改成9張純文字短卡，完整skills保留為查閱／摘錄資料。
- 空白短卡為259～514字元（包含標題、指令與填空標籤；不含使用者填入的程式／日誌）。這不是token數，也不是考場上限。
- 新增公告原文、分段／交接流程、紙本速查、handoff模板；模型名稱改為未知，不再依特定模型假設。
- 18份使用中的Markdown、93個相對連結、9份skill metadata、9張短卡分流與交接檔檢查通過。
- 本次是文件與提示卡調整，未變動程式範例，未重跑下方初版程式測試；官方網站取讀狀態仍是11月7日紀錄。
- 尚未測得考場實際字數／對話上限，也未評測考場模型；沒有代部署雲端入口。

## 2026-11-07：初版已完成

### 文件結構

- 15份使用中的Markdown文件、36個相對檔案連結檢查通過；舊稿存檔不列入使用中資料。
- 9份skill的資料夾／name一致、frontmatter、工作契約、固定輸出、現場資料包均存在。
- cheatsheet涵蓋全部9份skill；程式碼區塊成對、Python範例語法檢查通過。

### 來源與技術審查

- 對照本地 demo 程式、README、Dockerfile、Makefile、PDF 已解析內容與歷屆 README。
- 修正舊稿的 PDF 讀取紀錄、NOT 位寬、PIO 記憶體／autopull 簡化、共享 sink 與 volatile busy、wait/join 分工。
- 取讀官方 ROS Jazzy QoS 原始文件，確認 reliability／durability 相容性。
- 取讀 Pico SDK 官方 pio.h／dma.h，確認 shift／autopull／autopush API、DMA enum 編碼、default increment、configure 參數順序與新版 count helper。
- 取讀 RISC-V RV32I 官方20260120文件，核對立即數格式、PC基準、JALR與alignment區別。
- 網頁自動取讀受阻與未逐頁取讀的入口均列於 references.md，未把所有連結說成已驗證可用。

### 主機參考程式

環境：Windows，本機 MSYS2 UCRT64 GCC；Python 3.13。這不是考場 Linux／板端測試。

`examples/pthread_counter.c`：以 `-std=c11 -O2 -Wall -Wextra -Werror -pthread` 編譯成功，執行exit=0：

```text
counter=40000 expected=40000
checksum=399980000 expected=399980000
```

共享 counter 用mutex；每worker獨有checksum，main在join後讀取。預期checksum由等差數列公式獨立計算。
此測試驗證範例結果；同步正確性的理由仍是所有權、mutex與join，不是單靠一次執行。

`examples/wire_oracle.py`：驗證little-endian bytes、int32兩端邊界、空輸入、範圍外拒絕、CLI參數錯誤exit=2。
另核對SHA-1的`abc`已知向量、CRC-32/ISO-HDLC的`123456789 → 0xCBF43926`。

輸入 `1 -2 3` 的實際輸出：

```text
length_bytes=12
bytes_hex=01 00 00 00 fe ff ff ff 03 00 00 00
sha1_hex=77a48f509d89a0c3cb09e99fa4b9b495299e5341
crc32_iso_hdlc=0xA4B205E6
```

### 文件中的數值案例

- 以獨立欄位組合核對 `addi x1,x0,-1 = 0xFFF00093`。
- 以B-type欄位組合核對 `beq x1,x2,-4 = 0xFE208EE3`，PC=0x100時target=0xFC。
- 這是算術核對，未使用目標RISC-V assembler／disassembler。

## 尚未在本次執行

- 考場模型的實際評測：使用 calibration.md 記錄，不能把旗艦模型自行審查當作考場模型效果。
- Docker內的ROS端到端測試、Linux pthread編譯、Pico SDK交叉建置、PIO/DMA硬體驗證、正式judge。
- 猜題命中率：本包只給有來源的練習方向，不提供未經證實的出題機率。

## 考前自行驗收

1. 在你準備使用的瀏覽器／網站打開cheatsheet，確認短卡可點開／複製、完整skill可查閱，並列印紙本入口。
2. 依cheatsheet操作ROS `21→42`；記下三終端用途。
3. 考前用相近的純聊天介面跑C1、C2、C4、C6，模擬無上傳／無agent、分段與重開；當天以第一個實際小任務觀察模型能力。
4. 若模型回答漂移，用calibration的縮短模板重測；依實際結果保留有效措辭。
