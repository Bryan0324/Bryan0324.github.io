# 上機考紙本速查

筆記入口網址（考前填）：________________________________________

**選一個問題 → 貼短卡＋必要片段 → 要一個修改／觀察 → 自己執行 → 回傳原始結果。**
完整skills用來查規則，不預設全文貼得下。總索引在 `/tools/exam-kit/prompts/`，S0～S10 短卡在各技能頁首。

## 看到什麼，就選哪張

| 現象 | 短卡 | 貼什麼 |
|---|---|---|
| 剛拿到題目 | S0 triage | 本小題、評分、可改範圍、入口 |
| 看不懂程式片段 | S9 reading | 語言、片段／宣告、呼叫端、想理解的點、一筆輸入 |
| 能跑但錯／例外／卡住，原因未明 | S10 debug | 最小重現、預期依據、實際／traceback、呼叫順序、已試修改 |
| 工具／編譯／燒錄錯 | S1 build | 終端、目錄、指令、第一個error與上下文 |
| ROS沒資料／補callback | S2 ros | topic/type/QoS、初始化、callback、ID |
| ISA／格式 | S3 isa | 欄位圖、ISA/擴充、符號、PC、byte order |
| PIO／FIFO卡住 | S4 pio | .pio＋shift/FIFO/wrap/enable＋CPU收送 |
| 偶發錯／死鎖 | S5 concurrency | 共享宣告、所有讀寫者、lock/join、生命週期 |
| DMA搬錯／卡busy | S6 dma | API、buffer容量、count/size/increment/DREQ、完成 |
| 答案錯／移植 | S7 correctness | 最小輸入、預期/實際、wire規格、純函式 |
| 正確但慢 | S8 performance | 正確率門檻、送出/收到/正確/耗時、基準 |
| 想找替代解法 | X1 ideas | 硬限制、已確認資源、現有方法、已試方案、剩餘時間 |

X1：最多3個不同方案，各寫前提、資源、失敗點、最小實驗；選定後才用S卡實作，不直接大改。

S9：看懂現在怎麼做，先不改碼。S10：依預期與實際找第一個差異，一次一個修正／區分實驗。編譯錯走 S1，算法／wire 格式錯走 S7。

## 最短通用提示（雲端卡片暫時不便開啟時）

> 只處理這個小任務，命令由我執行。需求/限制：___；相關宣告與程式：___；指令/預期/實際：___。請給有證據的判斷、一個最小修改或檢查、預期觀察。不發明API，不假稱已測試；缺資料先問最關鍵的一項。

## 常用觀察指令（Bash／ROS shell）

```text
pwd                          ls -la
command -v ros2               printenv ROS_DISTRO ROS_DOMAIN_ID
ros2 node list               ros2 topic list -t
ros2 node info /NODE          ros2 topic info /TOPIC -v
ros2 interface show PACKAGE/msg/TYPE
ros2 topic echo /OUTPUT       ros2 topic hz /OUTPUT
```

NODE/TOPIC/TYPE要替換。echo/hz持續運作，Ctrl-C停止；它們也算subscriber。
單筆測試先開輸出echo，再送輸入。demo：
`ros2 topic pub --once /number std_msgs/msg/Int32 "{data: 21}"` → `/double`應收到42。
當天優先用提供的建置／啟動指令；先區分主機、container與板端。

## 十個高頻坑

1. topic存在≠有資料；publisher存在≠正在送；type相同≠QoS相容。
2. best-effort publisher → reliable subscriber不相容；多subscriber不自動分工。
3. PIO：TX→OSR→out；in→ISR→RX。移位方向、門檻、FIFO與CPU設定一起看。
4. explicit push＋autopush可能多送；RX滿、TX空或CPU收送順序都可能卡住。
5. volatile不提供同步；counter有鎖不代表sink/flag/buffer也安全。
6. 只鎖讀或寫不足以保護整個更新；IRQ和多核心的鎖要看平台。
7. DMA count是筆數，不是bytes；enum值未必等於每筆bytes。
8. copy通常兩端遞增，fill來源固定；完成前不得重用buffer；檢查第二輪重設。
9. hash先比bytes：padding、byte order、長度、ID、NUL；CRC要確認變體。
10. 發送率≠有效吞吐；先過正確率門檻，再量完整完成時間。

## 重開對話帶走六件事

目標／平台／可改範圍／必要API與單位／當前相關程式／已驗證的指令與結果。
模型摘要由你核對；兩次猜修無效就重新定位，不繼續疊patch。

## 官方文件入口

- ROS：`https://docs.ros.org/en/jazzy/`（當天版本以提供環境為準）
- RP2350：`https://datasheets.raspberrypi.com/rp2350/rp2350-datasheet.pdf`
- Pico SDK：`https://www.raspberrypi.com/documentation/pico-sdk/hardware.html`
- 完整連結與搜尋詞在筆記 `/tools/exam-kit/references.html`。
- 三者的按問題查詢導覽在 `/tools/exam-kit/docs-guide.html`。

## 考場規則提醒

只用考場聊天模型；不使用外部LLM、Agent、Copilot、搜尋AI摘要或通訊服務。可開自己的雲端筆記、帶紙本與書籍；禁止個人裝置。筆記入口與登入方式勿依賴手機。
