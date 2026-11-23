---
title: threads 自動發文-- python 實現
description: threads-py
date: 2026-01-03 12:00:00 +0800
tags:
  - threads
  - 教學
  - api
  - python
categories:
  - social media api
---
[參考自meta官方文件](https://developers.facebook.com/docs/threads/overview)  
{% post_link 4-threads-api-teach '可參考上一篇教學獲取access_token和其他需要的東西' %}
## 第一步
輸入
```bash
pip install threads-py \
  -i https://test.pypi.org/simple \
  --extra-index-url https://pypi.org/simple
```
然後
```python
from threads_py import ThreadsClient
client = ThreadsClient(
    user_id=str(secrets["user_id"]), # 你的用戶ID
    access_token=str(secrets["access_token"]) #你的access_token
)
```
- 發佈文章
```py
draft = client.create_post(text="Hello Threads!")
published = draft.publish()
```
- 發佈回覆
```py
reply_draft = client.create_post(text="Thanks for reading")
reply = published.reply(reply_draft)
```
- 發佈帶照片的文章 帶tag的文章
```py
image_draft = client.create_post(
        text="Check out this image!",
        image_url="https://http.cat/404.jpg",
        topic_tag="http-cat", #tag
    )
image_post = image_draft.publish()
```
- 發佈多照片/影片貼文
```py
carousel_draft = client.create_carousel(
        media_urls=[
            ("IMAGE", "https://http.cat/404.jpg"), 
            ("IMAGE", "https://http.cat/502.jpg"), 
            ("IMAGE", "https://http.cat/100.jpg")
            ],
        text="My carousel post",
    )
carousel_post = carousel_draft.publish()
```