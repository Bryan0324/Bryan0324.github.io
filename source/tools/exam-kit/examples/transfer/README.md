# 模擬 engine：copy／fill 工作描述模板

來源：[demo transfer-engine](../unclassified/demo/section2-3/README)。[engine_copy_fill.c](engine_copy_fill.c) 使用該目錄的真實 `engine.h`，示範 8 筆 uint32 copy、固定 pattern fill 與兩輪驗收。

## 建置與執行

在 **Linux／WSL `examples/`**：

```bash
cc -std=c11 -D_POSIX_C_SOURCE=200809L -O2 -Wall -Wextra -Werror -pthread -Iunclassified/demo/section2-3/transfer-engine transfer/engine_copy_fill.c unclassified/demo/section2-3/transfer-engine/engine.c -o engine_copy_fill
./engine_copy_fill
```

預期 `engine copy/fill: PASS (2 rounds)`。每次完成後檢查全部元素與尾端 sentinel；fill pattern 活到 wait 返回。

## 要改什麼

- `COUNT` 與來源／目的容量一起改。`count=8, size=XFER_32` 是 32 bytes，不是 count=32。
- copy：兩端遞增；fill：固定來源、目的遞增。非重疊、正確對齊的 buffer 才適用。
- `claim < 0` 不能傳入 configure。依題目決定排隊／等待／回報失敗。
- 範例 helper 由 caller 保證 count>0、容量與對齊；變成通用函式時先補這些檢查。
- 狀態順序：`claim → configure → start → wait → 使用結果／release`。非同步啟動後不能改來源或先讀目的。

## 原始 engine 的限制

`engine.c` 用 pthread 模擬搬運，`busy` 是 volatile，`engine_wait()` 也會在 join 前讀它；與 worker 的寫入存在資料競爭。`claim` 沒有多呼叫者同步，`pthread_create` 回傳碼也沒檢查。這個模板展示的是 **工作參數、容量與生命週期**；執行 PASS 不能證明原始 library thread-safe。

若題目要求修 library，需以 mutex／C atomics 處理 busy，並用獨立且受保護的「thread 已建立／需要 join」狀態保證每次建立只 join 一次、處理 pthread 錯誤。只在呼叫端少讀 busy 不能修好 library 內部競態。

實際 Pico DMA 請用 [Pico 模板](../pico/README)：API 名稱、參數順序與 enum 值均不同。
