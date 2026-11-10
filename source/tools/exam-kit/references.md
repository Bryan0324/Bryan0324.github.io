# 來源、查詢入口與勘誤

技術資料整理日期：2026-11-07；2026-11-10新增[考場公告](exam-rules)與聊天限制下的使用方式。下方網站取讀狀態仍是11月7日紀錄，未因文件更新而重新查核。
考場題目與當前環境優先於本包；網路master/latest文件可能比考場SDK新。公告說明環境版本不影響作答，當天沿用提供的流程，不必預先押定某套環境。

**查詢方式：**優先使用下表官方直接連結；搜尋時使用普通網頁結果，不使用AI摘要。文件由你開啟並摘取必要段落貼給考場模型，不使用外部LLM／Agent查詢。

快速入口：[RP2350 datasheet／Pico SDK／ROS 2導覽](docs-guide)，包含「遇到什麼查哪一份」、頁內搜尋詞與貼給模型的摘錄格式。三者提供官方連結與重點索引，沒有完整離線副本。

## 1. 證據分級

| 標記 | 意義 | 本包如何使用 |
|---|---|---|
| 考場公告 | 使用者提供的招生小組規則原文 | 決定工具、筆記、網路與裝置的使用方式；見exam-rules |
| 今年材料 | 本地 demo／116學年度演練 PDF 明確出現 | 準備範圍的主要依據；仍不等於正式考題 |
| 歷屆參考 | 本地歷屆 README 的流程／評分／題型 | 補充端到端操作與效能思路，不沿用板子／topic／配分 |
| 官方延伸 | 官方手冊／SDK／語言或工具文件 | 補齊 demo 省略的 QoS、硬體配置、同步細節 |
| 推測練習 | 根據上述線索設計的變體 | 練遷移能力，不宣稱命中或提供機率 |

## 2. 本地來源定位

下表 `demo/` 現位於 `examples/unclassified/demo/`，歷屆 README 也在 `examples/unclassified/`。行號沿用原文，未計入後加的網站 metadata 與收錄說明。以下頁數是初版記錄的 PDF 頁尾頁碼；目前資料夾未附該 PDF，無法從本包重現逐頁核對。

| 主題 | 依據與位置 |
|---|---|
| 練習不是考題 | `demo/README:3`；PDF「零、說明」頁1 |
| ROS CLI／資料流 | `demo/section2-1/README`；publisher.py、processor.py；PDF頁2～5 |
| C 位元／PIO／ISA 線索 | `demo/section2-2/README:14-17`、demo_asm.c、demo_pio.pio；PDF頁5～6 |
| lock／搬運介面 | `demo/section2-3/README`、critical-section/main.c、transfer-engine/engine.h／engine.c／main.c；PDF頁6～8 |
| 練習環境邊界 | `demo/Dockerfile:9-12,27-41`：沒有 Pico SDK、cross toolchain、judge |
| 歷屆架構與配分 | `歷屆成大上機README-僅供參考:5-23,62-83,202-241` |
| 歷屆移植／序列化 | 同檔 `144-196`：QSort、SHA-1、CRC32、little-endian bytes |
| 歷屆建置／agent | 同檔 `245-349,370-433`；檔案末尾不完整，不能視為完整操作手冊 |

初版紀錄記載 PDF 曾在先前對話中解析；本次檢查未重新取得 PDF，因此僅對現存 demo／歷屆 README 核對，PDF 引文保留為歷史來源紀錄。

## 3. 必須修正的簡化與程式問題

| 位置 | 問題 | 正確理解／實際後果 |
|---|---|---|
| PDF 位元表；demo_asm.c:12 | `~x` 簡寫成0x5A | 原程式做 `~x & 0xFF`；32-bit反相本身是0xFFFFFF5A |
| PIO 範例註解 | 「沒有記憶體」過度簡化 | 無一般通用資料 RAM；有 instruction memory、FIFO 等資源；各 PIO 版本還有差異 |
| PIO autopull 說明 | 「OSR 空了」不足以描述設定 | 看移出 bit 計數、threshold、autopull 設定與 stall 條件，不是看數值是否零 |
| critical-section/main.c:43,59,71 | sink 共享更新未同步 | 短鎖版本只保護 counter，仍有 sink data race；不是整支程式正確的範本 |
| critical-section/main.c:34,60-61 | volatile counter 非同步 | unlocked 版本有 C data race；觀察常見 lost update 不等於語言保證只會少加 |
| section2-3 README「總是少一些」 | 結果描述太絕對 | 可能碰巧等於預期；單核心也可交錯，且 data race 的語言行為不可依此保證 |
| engine.c:24,74,87,91 | volatile busy 跨執行緒存取 | 不建立 atomic/happens-before；連 wait 的條件讀取也涉及此 flag，不能宣稱只換 wait 就修好 library |
| engine.c:36-40 | claim 無同步 | 不能直接供多個 caller 同時 claim 使用 |
| engine.c:89-98 | wait 與 release 分工 | wait join；release 不自動 join。原 main.c:55-61 在 busy loop 後仍 wait |
| engine.c:43-54 | 檢查不等於完整 bounds check | 檢查 size/count/alignment，但沒有來源與目的容量資訊 |
| engine.c:3-6 | 真 DMA「CPU 零成本」過度簡化 | 搬運不需 CPU 逐元素執行，但配置、完成處理與匯流排競爭仍有成本 |

本包把這些寫成知識卡，保留原 demo 作為材料；修官方範例實作不是本次工作範圍。

## 4. 現場查詢網站：遇到什麼才打開

狀態說明：**已取讀**＝本次取得正文；**受阻**＝自動讀取遇防機器人／403，不代表瀏覽器無法開；**材料入口**＝來自本地文件或穩定官方入口，本次未逐頁取讀。

| 遇到的問題 | 連結 | 頁內搜尋詞／查什麼 | 本次狀態 |
|---|---|---|---|
| ROS node/topic 基礎 | [Jazzy Topics 教學](https://docs.ros.org/en/jazzy/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html) | topic info、interface show、pub | 材料入口 |
| pub/sub 存在卻不相通 | [Jazzy QoS](https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Quality-of-Service-Settings.html) | Request vs Offered、reliability、durability | 網頁受阻；官方原始正文已取讀 |
| QoS 頁面打不開 | [官方 QoS 原始文件](https://raw.githubusercontent.com/ros2/ros2_documentation/jazzy/source/Concepts/Intermediate/About-Quality-of-Service-Settings.rst) | Compatibility、Best effort、Reliable | 已取讀 |
| rclpy API | [rclpy Node](https://docs.ros.org/en/jazzy/p/rclpy/rclpy.node.html) | create_subscription、create_timer、create_publisher | 官方入口，未逐頁取讀 |
| micro-ROS agent/連線 | [micro-ROS Agent](https://github.com/micro-ROS/micro-ROS-Agent) | serial、transport、版本分支 | 歷屆材料入口 |
| micro-ROS C executor | [rclc 專案](https://github.com/ros2/rclc) | executor、subscription、example | 官方入口，未逐頁取讀 |
| RP2350 PIO 指令／DMA register | [RP2350 datasheet](https://datasheets.raspberrypi.com/rp2350/rp2350-datasheet.pdf) | PIO、PUSH、PULL、Autopull、TRANS_COUNT、DREQ、errata | 今年材料入口 |
| PIO CPU 初始化 | [Pico SDK PIO](https://www.raspberrypi.com/documentation/pico-sdk/hardware.html#group_hardware_pio) | sm_config_set_in_shift、out_shift、fifo_join、pio_sm_init | 同站硬體文件自動取讀受阻 |
| PIO 文件打不開 | [官方 pio.h](https://raw.githubusercontent.com/raspberrypi/pico-sdk/master/src/rp2_common/hardware_pio/include/hardware/pio.h) | shift_right、autopush、autopull、default、pio_get_dreq | 已取讀；master 可能更新 |
| DMA 配置／等待／sniffer | [Pico SDK DMA](https://www.raspberrypi.com/documentation/pico-sdk/hardware.html#group_hardware_dma) | dma_channel_configure、transfer_count、sniffer | 403 受阻 |
| DMA 文件打不開 | [官方 dma.h](https://raw.githubusercontent.com/raspberrypi/pico-sdk/master/src/rp2_common/hardware_dma/include/hardware/dma.h) | DMA_SIZE_32、write_addr、dma_encode_transfer_count、default | 已取讀；先比對本地版本 |
| 找 PIO／DMA 完整範例 | [pico-examples](https://github.com/raspberrypi/pico-examples) | pio、dma、CMakeLists | 官方入口，未逐頁取讀 |
| RISC-V 指令格式／立即數 | [RV32I 20260120](https://docs.riscv.org/reference/isa/v20260120/unpriv/rv32.html) | Base Instruction Formats、Immediate Encoding Variants、JALR | 已取讀 |
| 指令集其他擴充 | [RISC-V 已批准規格](https://riscv.org/specifications/ratified/) | Unprivileged、M、A、C | 今年材料入口 |
| pthread lock 用法 | [pthread_spin_lock](https://man7.org/linux/man-pages/man3/pthread_spin_lock.3p.html) | DESCRIPTION、ERRORS、RETURN VALUE | 今年材料入口 |
| 理解鎖與競態 | [OSTEP Locks](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf) | critical section、spin、fairness | 今年材料入口 |
| C 運算優先順序 | [cppreference](https://en.cppreference.com/w/c/language/operator_precedence) | precedence、associativity | 專業參考，非 C 標準原文；未逐頁取讀 |
| C atomic／記憶體順序 | [cppreference memory_order](https://en.cppreference.com/w/c/atomic/memory_order) | release、acquire、data race | 專業參考；未逐頁取讀 |
| Docker run/exec、掛載 | [Docker CLI](https://docs.docker.com/reference/cli/docker/) | container run、exec、mount | 官方入口，未逐頁取讀 |
| PlatformIO env／upload | [PlatformIO run](https://docs.platformio.org/en/latest/core/userguide/cmd_run.html) | environment、upload-port、target | 官方入口，未逐頁取讀 |
| Python struct byte format | [struct](https://docs.python.org/3/library/struct.html) | Byte Order、Size、Alignment、pack | 官方入口，未逐頁取讀 |
| 主機 hash／CRC 參考 | [hashlib](https://docs.python.org/3/library/hashlib.html)、[zlib](https://docs.python.org/3/library/zlib.html) | sha1、digest、crc32 | 官方入口，未逐頁取讀 |

### 查網站的順序

1. 先看題目附的版本與本機 header／`--help`。
2. 官方文件定位到精確 API 或相容性表，把相關十幾行貼給模型，不貼整本手冊。
3. 網頁受阻改查官方原始文件／GitHub；不把防機器人頁當成技術文件。
4. master/latest 與本機不同時，切到本機版本的 tag／分支。SDK helper 不存在時，不要改出一個虛構同名函式。

## 5. 歷屆演算法連結：有相應題目再開

- [EBNN](https://github.com/kunglab/ebnn/)：歷屆 MNIST 推論來源，並非今年已確認範圍。
- [MiBench](https://vhosts.eecs.umich.edu/mibench/)：歷屆移植來源；先對照輸入格式、授予的參考碼與演算法變體。

這兩個是歷屆 README 的連結，本次未重新取讀。不要為了猜題先花大量時間背整個演算法實作。
