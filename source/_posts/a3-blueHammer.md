---
title: blueHammer －－ 一個 windows 的零日漏洞
date: 2026-04-08
categories: [資安]
tags: [資安, 漏洞, windows, zero-day]
---

## 前情提要
我 草貓 資安小白 看到[這個漏洞的新聞](https://www.inside.com.tw/article/41022-disgruntled-researcher-leaks-bluehammer-windows-zero-day-exploit)就想說來寫一下筆記

# 本筆記可能有誤 請參考原文以及相關資安專業人士的分析 不要完全相信我寫的內容 我資安小白 可能會有誤解的地方 請多包涵 謝謝

## 正文

文中提及兩種攻擊技術
- **TOCTOU**: 檢查與使用競速條件
- **path confusion**: 路徑混淆

### TOCTOU
參考 [這篇文章](https://ithelp.ithome.com.tw/m/articles/10337320)
TOCTOU 是 Time of Check to Time of Use 的縮寫
簡單來說 就是
**當程式在檢查某個條件的時候** 和 **實際使用該條件的時候** 之間存在時間差
如附圖所示
![alt text](/img/a3-blueHammer/01-timeline.png)
攻擊者可以利用這個時間差來改變條件的狀態
舉例
像是這個程式不能在管理員權限下執行
但攻擊者可以在程式檢查完權限後 但在程式實際執行前 切換到管理員權限
這樣就繞過了權限檢查

### path confusion

#### confusion attack
參考 [這篇文章](https://devco.re/blog/2024/08/09/confusion-attacks-exploiting-hidden-semantic-ambiguity-in-apache-http-server/)
confusion attack
簡單來說就是不同組件對一個資訊的解讀不一致

而 path confusion 就是路徑混淆
攻擊者可以利用不同組件對路徑的解讀不一致來達到攻擊的目的

## blueHammer
```md
Phase 0: 身分分支
  wmain
   ├─ IsRunningAsLocalSystem ? YES → LaunchConsoleInSessionId → return
   └─ NO → 進入 Phase 1

Phase 1: 等待可觸發條件（更新）
  CheckForWDUpdates (WU COM 查找 Defender signature update)
  └─ 找到後進入 Phase 2

Phase 2: 準備更新素材
  GetUpdateFiles
   ├─ 下載更新 payload
   ├─ 從 PE 取出 CAB
   └─ FDICopy 解包 → UpdateFiles linked-list

Phase 3: 取得 VSS + 讓 Defender 進入可控狀態
  TriggerWDForVS
   ├─ ShadowCopyFinderThread：在 Object Manager \Device 下找新 VSS 名稱
   └─ FreezeVSS + CfCallbackFetchPlaceHolders
       ├─ [TOCTOU] 事件同步：等到 Defender 觸發回呼/查詢
       └─ [TOCTOU] oplock：建立可控停頓點 → “凍結/卡住”某段流程
  → 回到 wmain，帶回 fullvsspath（VSS 裝置路徑字串）

Phase 4: 觸發 Defender 更新 + 競態窗口 + 路徑重導
  for each target in filestoleak:
    4.1 建立暫存目錄並落地更新檔（UpdateFiles）
    4.2 WDCallerThread / CallWD
        └─ RPC 呼叫 Defender 更新（Proc42_ServerMpUpdateEngineSignature）
    4.3 [TOCTOU] 等 Defender 建立新 definition update 子目錄
        └─ ReadDirectoryChangesW + Wait...
    4.4 [TOCTOU] oplock：在某個關鍵更新檔建立停頓點並等待觸發
    4.5 [PATH] 佈置路徑混淆
        ├─ 建立/設定 reparse point (junction / mount point)
        └─ 建立 Object Manager symbolic link 指向 VSS\...\SAM
    4.6 讀取 Defender 新目錄中的檔案內容（實際已被導向）
    4.7 將內容寫出到 %TEMP% 檔案

Phase 5: 後處理（帳密/權限動作）
  DoSpawnShellAsAllUsers
   ├─ OROpenHive 打開 SAM hive
   ├─ 解 LSA/BootKey、解密 NTLM 相關資料（AES/DES）
   ├─ ChangeUserPassword：用 samlib.dll 修改其他本機帳戶密碼（再嘗試還原）
   └─ 依 token/權限嘗試建立不同層級的進程/console

* Copilot said: VSS 是 **Volume Shadow Copy Service（磁碟區陰影複製服務）**，是 Windows
VSS 是 Volume Shadow Copy Service（磁碟區陰影複製服務）的縮寫
VSS 是 Windows 的一個功能，允許用戶在不影響系統運行的情況下創建磁碟區的快照
VSS 可以用來備份系統或還原系統到之前的狀態
VSS 在此漏洞中被利用來創建一個可控的環境，讓攻擊者能夠在 Defender 更新過程中進行 TOCTOU 攻擊和路徑混淆攻擊

* oplock 是 **opportunistic lock（機會鎖）** 的縮寫
oplock 是 Windows 的一個功能，允許應用程式在訪問文件時獲得鎖定權限，以便在文件被其他應用程式訪問時能夠暫停自己的操作
oplock 可以用來實現 TOCTOU 攻擊中的停頓點


```
(copilot和我說的 可能有誤 請參考[原repo](https://github.com/Nightmare-Eclipse/BlueHammer/blob/main/FunnyApp.cpp))


## 後記
這個漏洞的利用方式非常複雜 涉及多個階段和多種攻擊技術
就只是借這個漏洞來去學習一下 TOCTOU 和 path confusion 這兩種攻擊技術

明天想講講[無限捲動（Infinite Scroll）](https://tingchun0113.medium.com/%E7%84%A1%E5%A5%97%E4%BB%B6%E5%AF%A6%E4%BD%9C%E7%84%A1%E9%99%90%E6%BB%BE%E5%8B%95-infinite-scroll-c0f08a4a6093)
和[無縫更改瀏覽器網址列](https://medium.com/@Esakkimuthu/history-javascript-api-6628d3c59b00)
(在[inside.com.tw](https://www.inside.com.tw/article/41022-disgruntled-researcher-leaks-bluehammer-windows-zero-day-exploit)這個網站看到這兩個技術 覺得有趣 就想說來講一下)