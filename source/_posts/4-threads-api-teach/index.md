---
title: threads 自動發文設定
description: meta developers建立應用程式
date: 2026-01-03 12:00:00 +0800
tags:
  - threads
  - 教學
  - api
categories:
  - social media api
---
[參考自meta官方文件](https://developers.facebook.com/docs/threads/overview)  

## 第一步 申請應用程式
到[meta developers](https://developers.facebook.com/apps)  
點`建立應用程式`  


![start](./1-start.png)
接下來輸入你想取的名字 信箱請填自己的  


![name](./2-start.png)
按`繼續`  


![choose](./3-start.png)
選`存取 Threads API` `繼續`  


![](./4-start.png)
選`我還不想連結商家資產管理組合。` `繼續`  

## 第二步 建立測試角色

![](./5-role.png)  
到右下角的`應用程式角色`選`角色`  


![](./6-role.png)
點`新增用戶`  


![](./7-role.png)
選`threads 測試人員` 並輸入自己的threads帳號  


![](./8-role.png)
點`網站權限`  
![](./9-role.png)
點`邀請` `接受`  
![](./10-role.png)  

## 第三步 測試
![](./11-token.png)
點`測試` `開啟圖形 API 測試工具`  


![](./12-token.png)
選`threads.net`  

<span id="get_user_id"></span>
![](./13-token.png)
點`Generate Threads Access Token` 記得保密(這個是短效的Access Token)  
*點完以後點上面的`提交`可以拿到 `user_id`


### 申請長效Access Token
![alt text](./14-token.png)
輸入`access_token?grant_type=th_exchange_token&access_token=<你的access_token>&client_secret=<你的client_secret>`
其中`<你的access_token>`為你剛申請的Access Token  
![alt text](./15-token.png)
`<你的client_secret>`則要在剛剛的面板點`應用程式` `基本資料` `Threads 應用程式密鑰`  
![alt text](./16-token.png)
就會看到長效的access token了

## 總結
[user id 獲取](#get_user_id)
[申請長效Access Token](#申請長效Access-Token)
