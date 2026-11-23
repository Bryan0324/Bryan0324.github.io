---
title: iconify svg資料庫
description: 網站設計隨筆記
date: 2025-12-29 12:00:00 +0800
tags:
  - 網站
  - 美化前端
  - svg
categories:
  - 前端設計
---
```yml
- name: GitHub
  link: https://github.com/Bryan0324
  icon: ri:github-line
  color: "#6e5494"
- name: Threads
  link: https://www.threads.com/@bryanhuang324
  icon: ri:threads-line
  color: "#545454"
```
這是本部落格設定的一部份  
我原本以為他的`icon`是內建的svg  
但後來(要加thread圖示)的時候發現他是用`iconify`做到的  
`iconify`提供了一個統一的框架來快速取用各類svg圖示  
呼叫範例`https://api.iconify.design/ri.json?icons=threads-line`  
即從`ri`(remixicon)這個庫中抓取名為`threads-line`的icon  
`https://icon-sets.iconify.design/`可以查詢可用的庫  