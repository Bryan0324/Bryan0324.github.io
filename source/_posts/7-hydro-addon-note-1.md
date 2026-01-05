---
title: hydro 套件開發隨筆記 -- 1
description: hydro 套件開發
date: 2026-01-04
tags:
    - 開發
    - hydro
    - typescript
    - web
    - request
categories:
  - hydro
---
# hydro 套件開發隨筆記 -- 1
參考自https://hydro.js.org/  
該文檔未更新之內容則從https://github.com/hydro-dev/Hydro  
如果不知道怎麼寫可以參考別人寫的像上面的官方的套件  

## Service
範例取自自己的套件[hydrooj-turnstile](https://www.npmjs.com/package/hydrooj-turnstile)  
最基礎的  
```ts
export default class TurnstileService extends Service {
    static Config = Schema.object({
        key: Schema.string().description('Turnstile key').required(),
        secret: Schema.string().description('Turnstile Secret').role('secret').required(),
    });

    constructor(ctx: Context, config: ReturnType<typeof TurnstileService.Config>) {
        super(ctx, 'hydrooj-turnstile');
    }
}    
```
這可以在`配置管理`(即/manage/config)中新增可以填數值的欄位  
![alt text](/img/7-hydro-addon-note-1/1-setting.png)
大概像這樣  

## ctx.on
```ts
// (放在constructor裡)
ctx.on('handler/after/UserRegister', async (thisArg) => {
    /* some function */
});
```
在`handler/after/UserRegister`發生會叫他  
IDE可以判別有什麼是可以呼叫的  
(包括但不限於`api/update` `problem/add`)  

## ctx.Route
```ts
ctx.Route('hitokoto', '/hitokoto', hitokotoHandler);
```
製造一個`/hitokoto`的路徑，由`hitokotoHandler`處理
`hitokoto`會是那個頁面的`data-page`(參考[注入HTML element](#注入HTML-element))

### Handler
```ts
class hitokotoHandler extends Handler {
    
    async get() {
    }
    async post() {
    }
}
```
`get`會在用戶提出請求時被調用(你可以給用戶渲染HTML)  
`post`會在提交時被調用(你可以查看他給你什麼並渲染HTML)  

#### get
```ts
async get() {
    this.response.body = ['hello', 'world'];
}
```
這個就不會渲染HTML 而是直接回傳資料給用戶  

```ts
this.response.body = this.request.body ||{
            packages: packages,
            lockedPackages: lockedPackages,
            success: null,
            result: null
        };
this.response.template = 'manage_addons.html';
this.renderHTML(this.response.template, {title: 'manage_addons'});
```
這個就會渲染HTML 並且用`manage_addons.html`這個template去渲染  
`manage_addons.html`會收到`this.response.body`內的內容  
詳細可參考[template 渲染](#template-渲染)  

#### post
```ts
async post() {
}
```
他會收到用戶給的資訊 在`this.request.body`裡  
```ts
{
    package_name : "something"
}
```
之類的  
可以`this.request.body['package_name']`  

怎麼讓用戶回傳可以參考[template 渲染](#template-渲染)  

## UserFacingError
import  
```ts
import { UserFacingError } from 'hydrooj';
```
```ts
throw new UserFacingError('Turnstile token is missing');
```
![範例圖](/img/7-hydro-addon-note-1/2-error.png)




## 注入HTML element
在你的套件建立`frontend/<不能有除_以外的特殊符號>.page.tsx`(放在`frontend`底下)  

```tsx
import { addPage, NamedPage } from '@hydrooj/ui-default';
addPage(new NamedPage(['hitokoto'], () => {
  console.log('我會在data-page為hitokoto的地方執行');
}));
```
### 查詢該頁 data-page
打開該網頁  
右鍵 選`檢查`  
![](/img/7-hydro-addon-note-1/3-data-page.png)
你就會看到`data-page`標籤了  

## template 渲染  
```html
{% raw %}{% extends "layout/basic.html" %}{% endraw %}
{% raw %}{% block content %}{% endraw %}
<div>
    <a>這樣外面就會套用"layout/basic.html"(如下)</a>
    <a>可以參考原版的模板去extends(記得注意他是把block插到哪裡 要取相同的block名稱)</a>
</div>
{% raw %}{% endblock %}{% endraw %}
```
![alt text](/img/7-hydro-addon-note-1/4-header.png)
可以調用[剛剛](#Handler)講的傳入的東西  
```html
<input type="text" name="package_name" value="{{ package }}" hidden >
```
這樣他的value就會是`body["package"]`  

```html
{% raw %}{% for package in packages %}{% endraw %}
<div>
    
</div>
{% raw %}{% endfor %}{% endraw %}
```
會遍歷`body["packages"]`  
```html
{% raw %}{% if package not in lockedPackages %}{% endraw %}
<a></a>
{% raw %}{% endif %}{% endraw %}
```
同理  

```html
<script>
    const message = {{ result | dump | safe }};
    alert('✓ success:  ' + message);
</script>
```
會傳入`{{ result }}`  
### 提交表單
```html
<form method="post" class="activate-package-form">
    <div class="activate-package-item">
        <a>{{ package }}</a>
        <input type="text" name="package_name" value="{{ package }}" hidden >
        {% if package not in lockedPackages %}
        <button type="submit" name="action" value="delete" class="btn btn--danger">{{ _('delete') }}</button>
        {% endif %}
        <button type="submit" name="action" value="update" class="btn btn--secondary">{{ _('update') }}</button>
    </div>
</form>
```
按下按鈕 會傳入
```ts
{
    package_name: "<{{ package }}>的值",
    action: "delete", //或"update"
}
```


## 參考
[hydro-github](https://github.com/hydro-dev/Hydro)  
[hydrooj-doc](https://hydro.js.org)  
和我的自製套件  
[hydrooj-addons-manager](https://github.com/Bryan0324/npm-packages/tree/main/hydro-plugins/hydrooj-addons-manager)  
[hydrooj-hitokoto-google-sheet](https://github.com/Bryan0324/npm-packages/tree/main/hydro-plugins/hydrooj-hitokoto-google-sheet)  
[hydrooj-turnstile](https://github.com/Bryan0324/npm-packages/tree/main/hydro-plugins/hydrooj-turnstile)  
