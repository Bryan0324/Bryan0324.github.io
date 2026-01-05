---
title: 什麼是XSS
description: 資安小教室1 何謂XSS
date: 2025-12-28 12:00:00 +0800
tags:
  - 資安
  - 網站
  - XSS
  - 注入式攻擊
categories:
  - 資安
---
今天一樣寫套件  
程式如下  
![附圖一](/img//2-what-is-XSS/1.png)  
學長和我說會有XSS攻擊的可能  
我想 為什麼 XSS 不是要有使用者輸入才會有可能嗎  
後來發現是`/hitokoto`的內容可以供使用者輸入  

資安小教室 何謂XSS       (說好的競程呢  
XSS == Cross-site scripting == 跨網站指令碼  
這個攻擊的主要想法是  
透過在被害者端運行一段javascript來取得被害者的cookies  
再用得到的cookies去登入他的帳號之類的  

所以如果我們給用戶的html是"有毒的 (有攻擊者注入的一段javascript)"  
那用戶就會被毒到  
*因為Cookie預設上是不能跨網站的所以弄丟的會是只和你的網站相關的帳號  

那如何解決呢？  


不要用`innerHTML` 因為它會把內容渲染成實際的element  
改用像是`textContent`或是`innerText`等已渲染的純文字  
附圖二如下  
![附圖二](/img/2-what-is-XSS/2.png)

這次經驗讓我把過去學到的東西有了實際的形狀  