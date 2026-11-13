---
name: ncku-build-debug
description: 依終端、環境、編譯、連結、燒錄與啟動階段定位錯誤。指令找不到、套件匯入失敗、編譯失敗或板子無法燒錄時使用。
---

# S1｜環境、建置與啟動除錯

## 短提示卡

```txt
依真實指令與日誌判斷，命令由我執行，不要假稱已執行。先分清主機／container／板端、終端種類，再定位shell、import、compile、link、upload或runtime階段。
修第一個實質錯誤，不追最後的build failed或衍生錯。沿用既有建置工具；主機gcc不代替板端工具鏈，undefined reference不等於少include。ROS import失敗先確認環境與Python來源。
只給：①證據與原因（最多3句）②一個最小修正或檢查指令、執行位置 ③預期結果；若不同要回傳什麼。缺資料先問一項，不整份重寫。

目標／可改檔案：
終端、工作目錄、平台：
原始執行指令：
第一個錯誤及前後文：
相關建置設定／宣告（短節錄）：
最近改動：
```

## 工作契約

使用提供的指令、日誌與建置設定，區分觀察與假設；不要發明套件名、SDK API 或板子參數。
沒有 shell 工具時給人執行的命令，不宣稱執行成功。每個命令都寫執行位置與預期觀察。
保留既有建置流程與可改檔案限制，一輪只修第一個阻擋後續的根因。

## 診斷步驟

1. 確定終端：Windows PowerShell、WSL、主機 Linux、container、PlatformIO terminal 或其他虛擬環境。
2. 確定位置與工具來源：Linux 用 `pwd`、`ls -la`、`command -v TOOL`；PowerShell 用 `Get-Location`、`Get-Command TOOL`。
3. 分類第一個實質錯誤：
   - shell／檔案路徑：command not found、No such file。
   - Python import／環境：ModuleNotFoundError。
   - preprocess／compile：header missing、unknown type、語法／型別錯。
   - link：undefined reference、multiple definition。
   - upload：port missing／busy、權限、目標板不符。
   - runtime：進程退出、crash、timeout。
4. 對照建置檔與當前版本，找出最小修復。語法錯先修最前面的原因，別逐條處理衍生錯。
5. 用完全相同的原命令重跑。建置成功不等於已燒錄；燒錄成功不等於 ROS 已連線。

若程式已可啟動，問題在分支、狀態、例外或結果差異，帶最小重現交 [S10 分析 Debug](../ncku-debug-analysis/#短提示卡)；還看不懂片段則先用 [S9 程式解讀](../ncku-code-reading/#短提示卡)。

## 知識卡

| 現象 | 優先確認 | 不該直接做的猜修 |
|---|---|---|
| ros2／rclpy 找不到 | ROS shell 是否 source、Python 路徑、container 是否正確 | 在錯的 Python 裡任意 pip install |
| 找不到自訂 message | workspace 是否已建置、對應 install/setup 是否 source | 把自訂 message 改成 Int32 |
| C header 找不到 | include 路徑、SDK 版本、生成 header 是否建置 | 亂加同名空 header |
| undefined reference | 宣告與定義、連結來源／library、C/C++ linkage | 只再加一個 include |
| pthread 相關 link 錯 | host 平台是否支援、編譯／連結是否使用 -pthread | 在裸機韌體照搬 pthread |
| `.pio.h` 找不到 | PIO 生成步驟與 CMake 設定、program 名稱 | 手工編一份假生成檔 |
| serial port busy | agent／serial monitor／另一燒錄進程是否佔用 | 同時重開更多 agent |

### 本 demo 專屬資訊

- Dockerfile 的 base 是 `ros:jazzy-ros-core`，工作目錄 `/demo`，有 gcc/make。
- 主機用 `docker exec -it srecruit-demo bash` 開同 container 的新 shell。
- 此 image 的 Bash 啟動檔會 source ROS；必要時在 container 執行 `source /opt/ros/jazzy/setup.bash`。
- `/demo/section2-3` 用 `make`；這個 image 沒有 Pico SDK、cross toolchain、judge。

### 考場可用但必須替換的命令形式

```bash
# Linux：先看檔案，按現有建置系統選一種
pwd
ls -la
# 有 Makefile 才用 make；有題目既定 CMake build dir 才用 cmake --build
# 有 PlatformIO 設定才用下式，YOUR_ENV 替換成 platformio.ini 中的名稱
pio run -e YOUR_ENV
```

`pio` CLI 是 PlatformIO，不是 PIO 指令組譯器。Windows 的主機 gcc 也不是 RP2350 的交叉編譯器。
只有看到該考題的 micro-ROS/PlatformIO 設定，才採用其 clean、upload、agent 指令；不要照搬歷屆 env 或序列埠。

## 固定輸出

1. **錯誤階段＋證據**：引用一段原日誌。
2. **最可能原因**：最多兩個；資訊足夠時直接給最小修正。
3. **下一動作**：命令、目錄／終端、要觀察什麼；若 A/若 B 各代表什麼。
4. **通過後**：重跑原建置／啟動指令；需要查資料流時交 S2。

## 現場資料包（使用者填寫）

```text
目標與可修改檔案：
終端種類、pwd/Get-Location：
OS／板子／SDK／Python／編譯器（未知可留空）：
完整執行指令：
第一個錯誤與前後日誌（不要只貼最後的 build failed）：
相關 Makefile／CMakeLists.txt／platformio.ini／import：
最近一次修改：
```
