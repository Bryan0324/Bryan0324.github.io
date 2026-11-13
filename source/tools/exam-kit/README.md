# 考場協作包

入口是 [cheatsheet](./)。你熟悉 C 位元運算，其餘領域需要明確操作與判讀。

2026-11-10依[使用者提供的公告](exam-rules)調整：考場是有長度限制、不能上傳檔案的網頁聊天；模型名稱不公開。**現在預設使用短提示卡，完整skills供查閱與擷取必要段落。**

## 第一次使用

1. 在 cheatsheet 選目前現象，不必先判斷根因。
2. 打開[短卡索引](prompts/)，選 S0～S10 後複製頁首「短提示卡」的文字區塊；不必貼 YAML 或整頁詳解。
3. 填末尾資料包，只放本小題的必要程式與輸出；不知道就寫未知。太長時按操作指南縮小任務／保留必要關係。
4. 模型應先給可驗證的小步驟或最小修改。執行後回貼真實輸出。
5. 更換主題時只帶相關程式、規格與已驗證事實，避免把所有 skill 一次全部貼上。

短卡與完整skill都不要求模型讀外部檔案、瀏覽網站、執行shell或記得其他skill。你負責開文件、貼必要內容、執行與回報。來源連結是給你查證的入口。

想比較替代解法時使用[X1創意發想](prompts/#創意發想)：最多3個方案，各附前提、資源與最小實驗；你選定後，再交對應S卡實作。

## Skills 索引

| 編號 | 檔案 | 用途 |
|---|---|---|
| S0 | [ncku-exam-triage](skills/ncku-exam-triage/) | 規格、可改範圍、得分依賴、拆小任務 |
| S1 | [ncku-build-debug](skills/ncku-build-debug/) | Linux／container／Python／建置／燒錄分層診斷 |
| S2 | [ncku-ros-dataflow](skills/ncku-ros-dataflow/) | ROS 2 / micro-ROS 通訊、callback、型別與 QoS |
| S3 | [ncku-isa-binary](skills/ncku-isa-binary/) | ISA 編碼與二進位欄位規格，不重教基礎位元運算 |
| S4 | [ncku-pio-state-machine](skills/ncku-pio-state-machine/) | PIO 程式＋CPU 設定＋FIFO 阻塞分析 |
| S5 | [ncku-concurrency](skills/ncku-concurrency/) | thread/core/IRQ、共享狀態、鎖與生命週期 |
| S6 | [ncku-transfer-dma](skills/ncku-transfer-dma/) | 模擬 engine／Pico DMA 單位、方向、完成與資源 |
| S7 | [ncku-algorithm-check](skills/ncku-algorithm-check/) | 演算法移植、序列化、最小反例與獨立參考 |
| S8 | [ncku-performance](skills/ncku-performance/) | 正確率門檻、測量、吞吐、一次一個優化 |
| S9 | [ncku-code-reading](skills/ncku-code-reading/) | 程式片段、變數角色、控制／資料流、逐步追蹤與副作用 |
| S10 | [ncku-debug-analysis](skills/ncku-debug-analysis/) | 邏輯／執行錯誤、第一個偏離點、證據實驗、最小修正與回歸 |

看不懂程式先用 S9；有具體錯誤但尚不知在哪一層用 S10。編譯／環境錯用 S1；已定位到演算法或 wire 格式用 S7。S9／S10 可在任何題型中途使用，不必按編號依序做完。

## 完整skills的用途

考場把它當靜態知識筆記：短卡不夠時，只摘取相關規則、API或微型案例補給模型。SKILL不會在網頁聊天中自動載入，也不會提供執行工具。

各技能以網站 `index.md` 提供短卡與詳解；新增 S9／S10 另附同目錄 `SKILL.md`，供考前支援此格式的工具載入，詳細案例仍在 `index.md`。考前也可直接複製短卡做聊天練習；**考試期間外部LLM、AI Agent、Copilot等一律不能使用**。本包的考場流程只使用提供的聊天模型。

## 把資料放到考場能開的位置

本包是 Hexo 網站來源，入口為 `/tools/exam-kit/`；資料夾入口保留尾端 `/`。在部落格根目錄 `npm run build` 後，由網站的既有發布流程部署；只把 Markdown 原檔放到雲端不等於網站已能開啟。部署後實測短卡的開啟與複製，並準備[紙本速查](print-quickstart)與入口網址。登入不要依賴考場禁止的個人裝置；具體準備方式見[聊天操作指南](chat-workflow)。本次未發布到遠端。

## 建議準備順序

1. 操作一次 demo 的 ROS 單筆測試，熟悉三個終端的角色。
2. 用 S1 處理一個環境錯誤、S2 處理一個 topic 錯字。
3. 閱讀 S4/S5/S6 的知識卡與案例，補 PIO、同步、DMA 的陌生部分。
4. 做 [practice](practice) 的變體題，以 [calibration](calibration) 檢查模型輸出。
5. 最後才練效能。優先讓整個「選 skill→收集→修改→驗證」循環順暢。

## 文件分工

- [references](references)：今年／歷屆來源、已知簡化與錯誤、官方入口、搜尋詞、連線查核狀態。
- [docs-guide](docs-guide)：RP2350 datasheet、Pico SDK、ROS 2的集中入口、按問題查文件的順序與摘錄模板。
- [exam-rules](exam-rules)：最新公告原文與對準備方式的影響。
- [chat-workflow](chat-workflow)、[prompts](prompts/)：操作流程與短卡總索引；S0～S10 在各技能頁首，X1 與交接卡在 prompts 頁。
- [print-quickstart](print-quickstart)：紙本操作入口與高頻提醒。
- [practice](practice)：推測依據、具體練習題、驗收與解題提示。
- [mock-exams](mock-exams/)：120 分鐘模擬 A 卷、待完成程式、自動／人工評分、分開的參考解答與 Iceman Free 實測紀錄。
- [calibration](calibration)：用固定案例檢查考場模型是否忽略缺漏規格、發明 API 或改錯方向。
- [validation](validation)：本次實際完成的驗證與未驗證項目。
- [examples 模板索引](examples/)：ROS 2、micro-ROS、pthread、engine、Pico PIO／DMA、排序／序列化／CRC／SHA 參考；附替換欄位、建置與驗收步驟。
- [實用性檢查](readiness)：可用範圍、已修正阻礙與考前最後驗收。
