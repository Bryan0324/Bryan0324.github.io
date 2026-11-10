---
name: ncku-pio-state-machine
description: 聯合分析 RP 系列 PIO 程式、CPU 端設定與 FIFO 收送。遇到 .pio、OSR/ISR、autopull/autopush、bit 順序錯或狀態機卡住時使用。
---

# S4｜PIO 狀態機：程式＋設定＋資料流

## 短提示卡

```txt
依晶片、SDK、.pio與CPU設定一起分析。命令由我執行，不發明PIO指令或宣稱硬體測試通過。
資料流：TX→pull/autopull→OSR→out；in→ISR→push/autopush→RX。autopull/autopush看bit計數與門檻，不是看數值零。檢查兩種shift方向、threshold、FIFO join、offset/wrap、init/enable、CPU收送順序。explicit push疊autopush可能多送；blocking pull遇TX空、push遇RX滿會停。
只給：①第一個阻塞／錯位點，或最關鍵缺漏設定 ②一個最小修改／觀察 ③單word與連續兩word驗收。必要時用短狀態表，不整套重寫。

需求／可改範圍、晶片/SDK/SM：
.pio相關程式：
CPU shift/FIFO/wrap/enable及收送設定：
若有DMA，其關鍵設定：
輸入、預期、實際／卡住呼叫：
```

## 工作契約

先確認晶片、PIO 版本與實際 SDK；只用已知支援的指令／API。
PIO 不是通用 CPU，不憑直覺發明 add、xor 或任意記憶體操作。題目需要複雜運算時先檢查可實現性與可用資源。
只有 `.pio` 而沒有 CPU 設定時，列出阻擋判斷的設定；可給條件式分析，不能假稱已定位唯一根因。
沒有板子／工具就給人工操作，不宣稱組譯或硬體測試通過。

## 第一步：填狀態機設定表

| 欄位 | 必須取得的資訊 |
|---|---|
| 目標 | RP2040/RP2350、SDK 版本、PIO instance、SM 編號 |
| 程式 | program name、load offset、entry PC、wrap target/top |
| OUT | shift direction、autopull、pull threshold |
| IN | shift direction、autopush、push threshold |
| FIFO | join 模式、CPU/DMA 寫哪個 TX、讀哪個 RX |
| 執行 | init、enable、clock divider；GPIO 題另需 pin mapping/direction/function |

未知項要求貼出初始化／configure 呼叫，不用預設值冒充現場值。

## 第二步：追蹤一筆與連續兩筆

建立 `PC/指令｜OSR/剩餘資料｜X/Y｜ISR/累積 bits｜TX/RX｜是否阻塞` 表。
先選 `0x12345678` 這類 byte 不同的值，再送另一個不同值；全零／全一不足以揭露順序錯。
檢查每次 pull/in/out/push 的 bit 計數、wrap 時狀態、下一個 word 是否會進來。

## 必要知識卡

```text
CPU/DMA → TX FIFO → pull/autopull → OSR → out → destination
source → in → ISR → push/autopush → RX FIFO → CPU/DMA
```

- X/Y、OSR/ISR 是 32-bit；同一 PIO block 的 SM 共享 32 個 instruction slots，不是每台 SM 獨享一份 32 槽。
- PIO 沒有一般 CPU 那種通用資料 RAM；有指令記憶體、FIFO，RP2350 還有版本專屬功能，不能直接混用不同版本。
- `out x, n` 從 OSR 取 n bits；順序受 OUT shift direction 影響。
- `in x, n` 將來源的低 n bits 移入 ISR；放在 ISR 哪一端由 IN shift direction 決定。
- autopull/autopush 由 bit 計數與設定門檻控制，不是依 OSR/ISR 數值判斷「空」或「滿」。
- explicit `push` 與 autopush 可能造成額外輸出；explicit pull 與 autopull 的互動也須按當前程式分析。
- blocking pull 遇 TX 空會停；blocking push 遇 RX 滿會停。CPU 若先等 RX、卻尚未供給需要的 TX，可能形成互等。
- FIFO join 可能停用另一方向，不能假設 echo 在 TX-only 配置仍可雙向運作。
- `.wrap_target/.wrap` 是組譯標記／wrap 設定來源；使用生成的 config 或正確載入位址，不能忽略 offset。
- `set` 的 immediate 不是任意 32-bit 常數；`jmp x--` 的判斷／遞減語意不能直接當 C 的普通迴圈，尤其檢查零與最後一次。

## SDK 查詢詞（先對照現場 header）

`sm_config_set_out_shift`、`sm_config_set_in_shift`、`sm_config_set_fifo_join`、`pio_sm_init`、`pio_sm_set_enabled`、`pio_sm_put_blocking`、`pio_sm_get_blocking`。
若有 DMA，另查 `pio_get_dreq`，TX/RX 方向與 DMA 讀寫端要一致。

## 微型診斷例

以下是明確採「manual pull/push」的診斷骨架，不是所有題目的替代程式：

```pio
.program manual_echo
.wrap_target
    pull block
    out x, 32
    in x, 32
    push block
.wrap
```

前提：autopull=false、autopush=false、TX/RX 都可用、SM 已正確載入／初始化／啟用。
CPU 先寫 `0x12345678` 到 TX，再從 RX 讀，應得到同值。若這都失敗，先查設定／收送，不先加入複雜解析邏輯。
三指令 demo 省去 pull 是因它假設 autopull；不能把此前提遺漏。

## 固定輸出

1. **缺漏設定／設定表**。
2. **第一個阻塞或資料錯誤的位置與證據**，附簡短狀態追蹤。
3. **最小修改**：同時指出 `.pio` 與 CPU 設定需改的地方。
4. **驗收**：單筆不同 byte、連續兩筆、超過 FIFO 容量的連續測試；等待需有可停止／逾時的觀察方式。

## 現場資料包（使用者填寫）

```text
需求與可改檔案：
晶片／SDK／PIO instance／SM：
完整 .pio：
CPU 載入、設定、enable、收送程式：
若有 DMA，其設定：
輸入、預期、實際、卡在哪個呼叫：
目前有無可用組譯器／硬體：
```

查證入口：https://datasheets.raspberrypi.com/rp2350/rp2350-datasheet.pdf （搜尋 PIO、Autopull、Autopush、PUSH、PULL）
