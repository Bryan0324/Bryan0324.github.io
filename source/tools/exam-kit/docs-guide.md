# 三大官方文件：RP2350、Pico SDK、ROS 2

三者都已有官方連結與相關知識卡。本頁把查詢路徑集中起來；**這是導覽與重點索引，不是完整手冊的離線副本**。需要精確行為時，以題目、現場header與對應版本官方文件為準。

## 1. 先選哪一份

| 你要回答的問題 | 文件入口 | 它回答什麼 |
|---|---|---|
| 硬體到底怎麼運作？指令／暫存器有何限制？ | [RP2350 datasheet（官方PDF）](https://datasheets.raspberrypi.com/rp2350/rp2350-datasheet.pdf) | PIO指令語意、FIFO、DMA、DREQ、寄存器欄位、硬體限制與errata |
| C/C++裡如何配置與使用硬體？ | [Pico SDK硬體API](https://www.raspberrypi.com/documentation/pico-sdk/hardware.html) | 函式簽名、參數順序、預設值、初始化／等待／釋放方式 |
| 節點如何通訊？Python怎麼建立pub/sub？ | [ROS 2官方文件索引](https://docs.ros.org/)／[Jazzy文件](https://docs.ros.org/en/jazzy/) | ROS概念、CLI、message、QoS、rclpy與開發流程 |

**例：PIO無輸出。**先用datasheet理解stall條件，再用SDK確認CPU設定，最後用實際程式與觀察驗證。若是ROS根本沒送到板端，先查ROS與agent，不先改PIO。

## 2. RP2350 datasheet：Ctrl-F搜尋這些詞

| 現象／需求 | 搜尋詞 | 要摘出給模型的資訊 |
|---|---|---|
| PIO取錯bits | `OUT`、`IN`、`SHIFTCTRL` | source/destination、shift direction、bit count、設定欄位 |
| PIO卡住／多送資料 | `Autopull`、`Autopush`、`PUSH`、`PULL`、`FIFO` | 觸發條件、blocking條件、FIFO join、shift counter作用 |
| 迴圈次數／跳轉不對 | `JMP`、`wrap` | 判斷與遞減順序、wrap範圍、載入位址關係 |
| DMA筆數或下一輪錯誤 | `TRANS_COUNT`、`READ_ADDR`、`WRITE_ADDR` | count欄位／模式、位址遞增、何時reload或trigger |
| DMA接周邊停住 | `DREQ`、`TREQ_SEL` | 請求來源、TX/RX方向、節流條件 |
| 想用DMA計算校驗 | `SNIFF_CTRL`、`SNIFF_DATA` | 支援模式、seed、bit/byte變換、輸出處理；不能只看CRC名稱 |
| 多核心／中斷同步 | `SIO`、`spinlock`、`interrupt` | 共享資源與中斷行為，再查SDK同步原語 |
| 文件行為與現場不符 | `errata` | 是否與晶片修訂、使用模式相關；不要泛用其他晶片的修法 |

PDF搜尋可能有多個同名欄位；先定位到對應周邊章節，再讀描述與注意事項。頁碼可能隨修訂改變，優先記章節名／欄位名。
PIO指令與RISC-V CPU指令是不同層；若題目考CPU ISA，使用[參考索引](references.html)中的RISC-V手冊。

## 3. Pico SDK：從實際符號找API

| 要做的事 | 入口／搜尋符號 | 一定要核對 |
|---|---|---|
| 初始化PIO | [PIO API](https://www.raspberrypi.com/documentation/pico-sdk/hardware.html#group_hardware_pio)：`pio_add_program`、`pio_sm_init`、`pio_sm_set_enabled` | program offset、SM編號、init後是否已enable |
| PIO移位與FIFO | 同頁：`sm_config_set_out_shift`、`sm_config_set_in_shift`、`sm_config_set_fifo_join` | bool參數意義、threshold、是否停用另一方向FIFO |
| PIO↔DMA | 同頁：`pio_get_dreq` | PIO instance、SM、is_tx方向 |
| 配置DMA | [DMA API](https://www.raspberrypi.com/documentation/pico-sdk/hardware.html#group_hardware_dma)：`dma_channel_configure`、`channel_config_set_*` | dst/src順序、transfer size、increment預設值、trigger |
| DMA取得／完成／重用 | 同頁：`dma_claim_unused_channel`、`dma_channel_wait_for_finish_blocking`、`dma_channel_unclaim` | 資源不足政策、完成判斷、buffer與channel生命週期 |
| 多核心／mutex／critical section | [SDK原始碼](https://github.com/raspberrypi/pico-sdk)搜尋現場用到的同步符號 | 適用thread/core/IRQ、初始化、阻塞與IRQ保存規則 |
| 看完整建置與使用流程 | [官方pico-examples](https://github.com/raspberrypi/pico-examples) | 對應板子／SDK、CMake生成步驟、依賴library |

### 官方網頁讀不到時

- [官方pio.h](https://raw.githubusercontent.com/raspberrypi/pico-sdk/master/src/rp2_common/hardware_pio/include/hardware/pio.h)
- [官方dma.h](https://raw.githubusercontent.com/raspberrypi/pico-sdk/master/src/rp2_common/hardware_dma/include/hardware/dma.h)

這些master連結會更新。若本機宣告不同，以本機版本為準，或在GitHub切換對應tag。
過去自動取讀SDK網站曾遇403；瀏覽器可否開啟需現場確認，原始header是備援入口，不代表可以省略硬體語意。

## 4. ROS 2：概念、CLI、API各查哪裡

| 現象／需求 | 文件 | 頁內搜尋詞 |
|---|---|---|
| 列節點／topic、看型別、發測試資料 | [Topics教學](https://docs.ros.org/en/jazzy/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html) | `topic info`、`interface show`、`pub`、`echo` |
| pub/sub存在但無資料 | [QoS概念與相容性](https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Quality-of-Service-Settings.html) | `Request vs Offered`、`reliability`、`durability` |
| Python pub/sub/timer | [rclpy Node API](https://docs.ros.org/en/jazzy/p/rclpy/rclpy.node.html) | `create_publisher`、`create_subscription`、`create_timer` |
| 板端micro-ROS接不上 | [micro-ROS Agent](https://github.com/micro-ROS/micro-ROS-Agent) | `serial`、`transport`、版本分支 |
| 板端C callback/executor | [rclc](https://github.com/ros2/rclc) | `executor`、`subscription`、examples |

QoS頁面若遇防機器人畫面，可查[官方Jazzy原始文件](https://raw.githubusercontent.com/ros2/ros2_documentation/jazzy/source/Concepts/Intermediate/About-Quality-of-Service-Settings.rst)。
本demo是Jazzy；考場先看當天提供的版本與啟動方式，再選相應文件，不為了符合本筆記而重裝環境。
CLI參數也可先用本機 `ros2 topic echo --help`／`ros2 topic pub --help` 查詢。

## 5. 把文件變成模型可用的小資料包

文件由你開啟，選與當前問題直接相關的宣告／相容性表／限制條款，附到對應S2/S4/S5/S6短卡；不要貼整本PDF。

```text
平台與版本：
這次要完成的事：
官方文件URL與章節／API名稱：
相關原文（含參數、前提、預設值或限制）：
我實際呼叫／設定：
預期與實際：
請先對照原文找出不符合的地方，再給一個最小驗證；不要以記憶取代我貼的版本。
```

**涵蓋範圍：**本包已準備ROS資料流、PIO、DMA、併發等常見路徑，並未摘要三套文件的所有章節。遇到新周邊時，沿「硬體語意→SDK呼叫→實際驗證」查詢即可。
本頁沿用既有官方入口，未新增宣稱已完成的網頁／硬體驗證；既有取讀紀錄見[references](references)。
