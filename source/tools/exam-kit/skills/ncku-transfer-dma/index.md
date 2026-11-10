---
name: ncku-transfer-dma
description: 檢查 transfer engine 或硬體 DMA 的 count、size、位址遞增、DREQ、buffer 所有權與完成流程。搬錯、越界、填值錯、卡 busy 或要配置搬運時使用。
---

# S6｜搬運引擎與 DMA

## 短提示卡

```txt
先辨識demo engine_*或真正SDK，以我貼的header為準。命令由我執行，不假稱硬體驗證。
核算count(transfers)×每筆bytes及兩端容量/對齊。copy通常兩端遞增；fill來源固定；FIFO端通常固定並需正確DREQ。buffer與pattern活到完成，完成前不重用。claim失敗不能configure，busy輪詢不替代demo的wait/join。
demo XFER_8/16/32值為1/2/4；Pico DMA_SIZE值為0/1/2，不能當bytes乘。Pico configure通常dst在src前；RP2350 count模式/helper依本機版本確認。volatile busy不是可靠thread同步。
只給：①描述表與bytes計算 ②一項最小修正/檢查 ③元素、sentinel與第二輪驗收。不用加大buffer掩蓋錯誤。

目標／API與SDK版本／可改範圍：
src/dst型別、容量與生命週期：
count/size/increment/DREQ/trigger：
相關宣告、configure/start/wait片段：
預期、實際：
```

## 工作契約

第一步先辨識 `engine_*` 模擬 API 或真正的硬體 SDK。不同 enum、函式參數順序與完成方式不可互換。
優先使用本機 header／題目提供的 API。沒有硬體工具時給人執行的檢查，不宣稱已驗證 DMA。
不要為了讓傳輸成功而把 buffer 變大掩蓋 count 錯誤；維持題目要求的搬運範圍。

## 步驟一：工作描述表

列出 `source／destination 位址與型別｜兩端容量 bytes｜count transfers｜每筆 bytes｜兩端 increment｜對齊｜觸發／DREQ｜完成方式`。
另外列 buffer／fill pattern 的擁有者、有效期、CPU 是否在搬運中讀寫。

## 步驟二：單位與範圍推導

1. 搬運總量 = count × 每筆 bytes，先檢查乘法是否溢位。
2. 遞增端需要可存取至少該總量；固定端通常只需一筆寬度，但若是 MMIO，要符合周邊存取寬度／副作用規則。
3. count 不是 sizeof(buffer)；從 byte 數換算需可被每筆 bytes 整除，餘數按題目明訂處理。
4. 固定 pattern fill 的來源不遞增；copy 兩端遞增；周邊 FIFO 位址通常固定。
5. 不假設重疊 copy 有 memmove 語意，也不假設 increment boolean 支援任意 stride／倒序。

## 步驟三：生命週期與進度

取得通道→檢查失敗→配置→啟動→等完成→取用結果→釋放／按 SDK 規定重用。
搬運完成前不釋放來源、不改來源、不重用目的，也不把區域 pattern 的位址帶出有效生命週期。
卡 busy：查是否真的 start、channel enable、DREQ 方向、FIFO 有無對端、是否有等待循環；不要先無限增加 timeout。
下一輪前重裝需要重設的位址與 count，不能假設硬體自動還原所有設定。

## 模擬 engine 知識卡（本 demo 專用）

```c
typedef enum { XFER_8 = 1, XFER_16 = 2, XFER_32 = 4 } xfer_size_t;
typedef struct {
    const void *src;
    void *dst;
    size_t count;
    xfer_size_t size;
    bool src_increment, dst_increment;
} engine_job_t;
int engine_claim(void); /* -1 表示沒有可用通道 */
void engine_configure(int ch, const engine_job_t *job);
void engine_start(int ch);
bool engine_busy(int ch);
void engine_wait(int ch);
void engine_release(int ch);
```

- header 需提供 bool/size_t 定義。四個通道是 demo 的數量，不是硬體通道數。
- count=0 被拒絕；size 限 1/2/4 bytes、兩端需對齊；引擎沒有 buffer bounds 檢查。
- claim=-1 時必須依需求等待／排隊／回報，不能拿 -1 configure。
- busy 輪詢後仍需 wait/join；release 本身不代替 join。
- library 的 busy 用 volatile 跨執行緒，不是嚴謹同步；多呼叫者 claim 也無保護。修 library 的併發問題交 S5，不能稱這個 demo 無 race。

## Pico SDK 查詢卡（必須對照現場版本）

- `DMA_SIZE_8/16/32` enum 編碼是 0/1/2，不是 byte 數 1/2/4；使用符號與明確寬度換算。
- `dma_claim_unused_channel(false)` 可回傳 -1；required=true 的失敗政策不同。
- 常見 API：`dma_channel_get_default_config`、`channel_config_set_transfer_data_size`、`channel_config_set_read_increment`、`channel_config_set_write_increment`。
- `dma_channel_configure` 常見順序為 channel、config、**write/dst**、**read/src**、count、trigger；以現場宣告確認。
- `trigger=true` 會在配置時啟動，不要又當它尚未啟動而錯誤安排 buffer 操作。
- FIFO 用對應 DREQ 節流；PIO 的 `pio_get_dreq(pio, sm, true)` 對應 TX，false 對應 RX。
- SDK default write increment 可能是 false，記憶體 copy 要明確設置。
- RP2350 count register 有模式位元；新版有 `dma_encode_transfer_count` 等 helper，舊版可能沒有。用現場版本支援的普通 count／編碼方式，不混用最新範例。
- 使用 SDK 的完成等待／IRQ 協定；C atomic 並不能自動代替硬體 DMA 的完成與平台記憶體規則。

## 微型案例

4096 個 uint32_t copy：count=4096，size=XFER_32（demo），總量16384 bytes，兩端 increment=true。
4096 個 word 填 `0xA5A5A5A5`：來源是一個仍有效的 uint32_t pattern，source increment=false，destination=true。
測試用目標區後放 sentinel，檢查每個元素與 sentinel。demo 的 `make mistake` 故意擴大配置以展示超過「預定區」的寫入，不能照抄成正式修法。

## 固定輸出

1. **API 身分＋工作描述表＋總 bytes 計算**。
2. **根因／缺漏**：只列有證據或能區分的候選。
3. **最小呼叫流程**：檢查 claim 失敗、配置、啟動、完成與釋放。
4. **驗收**：少量不同數值、整個目標區、尾端 sentinel、連續兩輪；卡住則給下一個觀察點。

## 現場資料包（使用者填寫）

```text
需求：copy／fill／FIFO／其他
平台／SDK 與 API 宣告：
可改檔案：
src/dst 型別、配置容量、生命週期：
count、size、increment、DREQ／trigger：
configure/start/wait/release 完整程式：
預期、實際、是否只在第二輪／高負載失敗：
```

查證入口：https://www.raspberrypi.com/documentation/pico-sdk/hardware.html#group_hardware_dma
