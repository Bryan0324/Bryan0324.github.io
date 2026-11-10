---
name: ncku-concurrency
description: 分析共享資料、thread/core/IRQ、同步、生命週期與死鎖。結果偶發錯、counter 遺失更新、鎖太大、背景工作存取重用 buffer 時使用。
---

# S5｜併發正確性與臨界區

## 短提示卡

```txt
先確認pthread、裸機多核心、RTOS或IRQ，不能只替換鎖API名稱。依所有共享讀寫路徑分析，不只counter。volatile不是atomic或同步；atomic load再store也不等於atomic RMW。
列出變數/讀者/寫者/保護/生命週期，給一個錯誤交錯或等待循環。只把不依賴可變共享狀態的計算移到鎖外。IRQ等待被它中斷者持有的鎖可能死鎖；關本核心IRQ不保護另一核心。callback借用buffer不能任意延後使用。
只給：①有證據的問題 ②最小修正及同步理由 ③可執行驗收。一次跑對不證明無race；命令由我執行。

平台／可改範圍：
需求與不變條件：
共享宣告、相關讀寫／lock／join片段：
其他讀寫者（未知就填未知）、buffer生命週期：
預期、實際、重現條件：
```

## 工作契約

先確認主機 pthread、裸機多核心、RTOS task 或 IRQ；使用該平台已提供的同步 API，不混用。
以所有共享存取路徑為依據，不只看使用者懷疑的 counter。不把 volatile 當同步。
只改允許範圍；沒有執行能力時給可重現測試與預期，不能宣稱壓測通過。

## 步驟一：建立共享狀態表

列出 `變數／buffer｜讀者｜寫者｜thread/core/IRQ｜生命週期｜保護機制｜必須保持的不變條件`。
包含 counter、sink、busy/ready flag、channel allocator、queue head/tail、callback 的 message pointer。
若只看到局部函式，要求相關宣告與其他讀寫路徑。

## 步驟二：找錯誤的交錯與完成關係

1. 非 atomic 的衝突存取缺同步，在 C/C++ 中可能是 data race／未定義行為，不能承諾只會「少加幾次」。
2. `counter++` 是 read-modify-write；用 atomic load 再 atomic store 仍可能 lost update，要用正確 RMW 或整段鎖。
3. producer 設 ready 後，consumer 能否保證看到完整 payload？需要 mutex、合適的 atomic ordering、queue 等同步關係。
4. thread join 是完成關係的一部分；先 join 才讀 worker 獨有的結果。硬體 DMA 完成則依 SDK／平台規則判定。
5. 查同一 buffer 是否仍被 callback、DMA、另一核心或尚未完成的工作使用。

## 步驟三：選最容易驗證的修法

- 獨立統計：每 worker 自己累積，完成／join 後合併；只在不需要即時共享狀態時採用。
- 簡單共享更新：同一把 mutex 保護完整更新與其他衝突路徑。
- atomic：只有 API／記憶體順序／平台支援清楚時才用；atomic counter 不自動保護旁邊的陣列。
- 縮鎖：耗時計算若只用 thread-local 或 immutable input，可移到鎖外；若依賴共享狀態，先定義 snapshot／驗證後提交的語意。
- 硬體 spinlock／critical section：使用 SDK 對應的初始化、IRQ 保存與恢復規則。

## 死鎖與效能檢查

- 是否同一 thread 重複拿非 recursive lock？所有路徑是否 unlock？多把鎖是否有一致順序？
- 持鎖時等待另一個也需要此鎖的 thread／IRQ／DMA 完成，可能形成循環等待。
- IRQ 若自旋等待被它中斷的程式釋放同一把鎖，同核心可能永遠無法前進。
- 關閉本核心 IRQ 不等於阻止另一核心存取；多核心與 IRQ 要一起分析。
- 單核心也可有排程交錯。race 測試偶爾成功不代表安全；stress test 不是同步正確性的證明。
- busy loop 佔 CPU；先確定等待原語與工作依賴，再討論效能。

## 本 demo 的重要案例

```c
sink += work(i);             /* sink 是共享變數 */
pthread_spin_lock(&lock);
counter++;
pthread_spin_unlock(&lock);
```

counter 有鎖，**sink 仍有 race**。若 sink 只用來彙總獨立運算，可改每 worker 的 local sink，join 後合併。
不能只把 sink 標成 volatile；也不能保證此版程式整體正確，或用一次 40000 的輸出作證。
transfer engine demo 的 volatile busy 與未加鎖的 claim 也需要同樣審查；直接 wait/join 的用法不代表 library 內部所有 race 都消失。

## 固定輸出

1. **共享表＋一個具體交錯／等待循環**。
2. **最小修正**，說明為什麼涵蓋所有衝突路徑。
3. **同步依據**：誰擁有資料、何時交還、哪個 lock/join/atomic 規則保證可見性。
4. **驗收**：固定工作量的預期值、重複／負載測試、完成後讀取；若有 host ThreadSanitizer 可用，說明目標限制，不能拿硬體韌體直接套用。
5. 正確性建立後才交 S8 縮鎖或平行化。

## 現場資料包（使用者填寫）

```text
平台：pthread／多核心裸機／RTOS／IRQ（未知可寫未知）
需求與不變條件（例如每筆只處理一次）：
可修改檔案：
共享變數宣告與所有讀寫函式：
thread/core/IRQ 啟動、等待、清理程式：
buffer 的建立、重用、釋放時機：
預期、實際、重現頻率：
```

查證入口：https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf
