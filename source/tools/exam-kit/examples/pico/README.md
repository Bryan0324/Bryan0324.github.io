# Pico SDK：PIO echo ＋ DMA copy／fill

依 [demo PIO](../unclassified/demo/section2-2/README) 與搬運練習補成最小 SDK 專案：

- [exam_echo.pio](exam_echo.pio)：每送一個 32-bit word，回一個同值 word。
- [main.c](main.c)：PIO 設定／收送／清理，以及真實 DMA 的記憶體 copy／fill。
- [CMakeLists.txt](CMakeLists.txt)：產生 `.pio.h`、連結 SDK、輸出 UF2。

兩個檢查獨立執行，無 GPIO 接線。這份專案需 **Pico SDK、對應工具鏈與開發板**；原 ROS demo image 沒有這些。尚未在板端驗證。

## 建置與要改的地方

若題目已有專案，搬入必要函式並沿用其建置方式。獨立練習時，在 **`examples/pico/` 的 Bash** 執行：

```bash
export PICO_SDK_PATH=/實際安裝位置/pico-sdk
cmake -S . -B build -DPICO_BOARD=pico2
cmake --build build
```

`pico2` 是 RP2350 Pico 2 的範例板型，改成實際板型；架構／SDK 版本沿用現場規格。切換板型或架構使用新的 build 目錄。輸出 `build/exam_pico.uf2`，依板子的既有燒錄方法操作，USB serial 預期看到：

```text
DMA copy/fill: PASS
PIO echo: PASS
```

程式開機等 2 秒再印結果；若錯過，開好 serial monitor 後重啟。PASS 是此模板的預期，不代表這裡已做過硬體測試。

## PIO 設定與驗收

| 設定 | 模板值 | 原因 |
|---|---|---|
| OUT shift | right、autopull=true、threshold=32 | `out x,32` 取得下一個 TX word |
| IN shift | right、autopush=false、threshold=32 | `.pio` 已有 explicit push，只送一次 |
| FIFO join | NONE | 同時使用 TX 與 RX |
| wrap／PC | generated config(offset)、init(offset) | program 可裝在非零 offset |
| GPIO | 無 | X/ISR/OSR 內部 echo，不操作 pins |
| 收送 | 一送一收、1 秒 timeout | 不先塞滿 TX 再永遠不讀 RX |

連續測 0、`0x12345678`、`0x89ABCDEF`、`0xFFFFFFFF` 兩輪，並檢查沒有額外 RX word。timeout 後清理該 SM；不要把殘留資料當下輪結果。

## DMA 設定與驗收

範例用 8 個 uint32、兩輪 copy／fill；每次重新 configure 位址與 count，等待完成才讀目的或釋放 channel，檢查尾端 sentinel。

- `dma_channel_configure(ch, &config, dst, src, count, true)`：**dst 在 src 前面**。
- `DMA_SIZE_32` 是 enum，不是數字 4；count 是 transfers。這裡只用小筆數的普通傳輸，不設定 RP2350 count 模式位元。
- `DREQ_FORCE` 適用本例記憶體搬運。串 PIO 時改成下表，且同時設好另一端的收送流程。

| 路徑 | read increment | write increment | DREQ | 固定周邊位址 |
|---|---|---|---|---|
| memory → memory | true | true | DREQ_FORCE | 無 |
| 固定值 → memory | false | true | DREQ_FORCE | 無 |
| memory → PIO TX | true | false | `pio_get_dreq(pio, sm, true)` | `&pio->txf[sm]` |
| PIO RX → memory | false | true | `pio_get_dreq(pio, sm, false)` | `&pio->rxf[sm]` |

若擴充成批次 TX/RX DMA：先讓接收端 ready，再啟動送出，兩邊都完成才能使用／重用 buffer。只啟動 TX 後阻塞等待、卻沒有人排空 RX，可能因 RX 滿導致 PIO 停住、TX DMA 也完成不了。來源與 fill pattern 必須活到完成；記憶體重疊不適用本 copy 模板。
