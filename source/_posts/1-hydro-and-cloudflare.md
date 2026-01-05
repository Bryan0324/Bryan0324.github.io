---
title: hydro + cloudflare 食用說明
description: online judge 開發
date: 2025-12-25 12:00:00 +0800
updated: 2025-12-25 10:00:00 +0800
tags:
  - hydro
  - 教學
  - cloudflare
categories:
  - hydro
---
# hydro + cloudflare 食用說明


## 0. 基礎名詞介紹
### hydro 是什麼
他是 github 上最多 star 的線上評測系統  
[hydro github 連結](https://github.com/hydro-dev/Hydro)  
之後會介紹 hydro (?  
### cloudflare 是什麼  
((我們主要會用 DNS 服務  
即 域名解析服務  

#### 什麼是域名  
簡單來說 域名 == 地標  
舉例 "臺北賓館" 這是一個地標  
而他的地址是 "10048臺北市中正區凱達格蘭大道1號"  

此處 "臺北賓館" 是域名  
"10048臺北市中正區凱達格蘭大道1號" 是 IP  

對應到 "google.com" 是域名  
"8.8.8.8" 是 IP  

那外國人怎麼知道 "臺北賓館" == "10048臺北市中正區凱達格蘭大道1號"  
會需要一個人指路  
cloudflare 就是負責指路的  
:::success 
:::spoiler 詳細
如何上網  
0. 你 在你的*瀏覽器*輸入域名 (ex: google.com)  
1. 瀏覽器 去 根域名伺服器（.）  
2. 根域名伺服器 去 `.com` TLD 伺服器  
3. `.com` TLD 伺服器 去 Google 的授權名稱伺服器  
4. Google 的授權名稱伺服器 回傳 `www.google.com` 的 IP  
而 cloudflare 是 名稱伺服器  
:::
### Caddy 是什麼
反向代理  
客戶端訪問 Caddy，Caddy 接收請求，然後根據配置將請求轉發（代理）到後端一個或多個伺服器（例如，Web 應用、API 服務）。  

## 1. 架設 hydro
參考自[hydro github README](https://github.com/hydro-dev/Hydro)  
首先 先在你要架設的電腦上輸入  
```shell=
LANG=zh_TW . <(curl https://hydro.ac/setup.sh)
```
之後會有 `.hydro` 資料夾  
打開之後會有 `Caddyfile`  
:::spoiler 範例
```yml
# 如果你希望使用其他端口或使用域名，修改此处 :80 的值后在 ~/.hydro 目录下使用 caddy reload 重载配置。
# 如果你在当前配置下能够通过 http://你的域名/ 正常访问到网站，若需开启 ssl，
# 仅需将 :80 改为你的域名（如 hydro.ac）后使用 caddy reload 重载配置即可自动签发 ssl 证书。
# 填写完整域名，注意区分有无 www （www.hydro.ac 和 hydro.ac 不同，请检查 DNS 设置）
# 请注意在防火墙/安全组中放行端口，且部分运营商会拦截未经备案的域名。
# 其他需求清参照 https://caddyserver.com/docs/ 说明进行设置。
# For more information, refer to caddy v2 documentation.
:80 {
	encode zstd gzip
	log {
		output file /data/access.log {
			roll_size 1gb
			roll_keep_for 72h
		}
		format json
	}
	# Handle static files directly, for better performance.
	root * /root/.hydro/static
	@static {
		file {
			try_files {path}
		}
	}
	handle @static {
		file_server
	}
	handle {
		reverse_proxy http://127.0.0.1:8888
	}
}

# 如果你需要同时配置其他站点，可参考下方设置：
# 请注意：如果多个站点需要共享同一个端口（如 80/443），请确保为每个站点都填写了域名！
# 动态站点：
# xxx.com {
#    reverse_proxy http://127.0.0.1:1234
# }
# 静态站点：
# xxx.com {
#    root * /www/xxx.com
#    file_server
# }

```
:::
照他的提示將`:80`改成你的域名  
## 2. 開啟 cloudflared tunnel
1. 安装 Cloudflared
```shell=
# 下載 cloudflared 最新版本
curl -LO https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# 安裝
sudo dpkg -i cloudflared-linux-amd64.deb
```
2. 登陸 Cloudflare
```shell=
cloudflared login
# 他應該會給你連結或是直接開瀏覽器
```
3. 創建 Tunnel
```shell=
cloudflared tunnel create hydro-tunnel
```
會生成一個 .cloudflared 資料夾  
裡面會有一個 json  
其檔名會是 `Tunnel UUID` (e.g. xxxx-xxxx-xxx-xx-xxxxxx)  
4. 在 .cloudflared 資料夾中建立 `config.yml`  
```yaml=
tunnel: <YOUR_TUNNEL_UUID>  # 上一步生成的 UUID
credentials-file: ~/.cloudflared/<YOUR_TUNNEL_UUID>.json

ingress:
  - hostname: <你的域名>
    service: http://127.0.0.1:8888  # Hydro 後端
  - service: http_status:404
```
5. 設定其自動運行  
(註：可以先用`cloudflared tunnel run hydro-tunnel`測試可不可以用)  
一樣shell  
```shell=
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```
## 3. 設定域名  
1. 去你的域名供應商把 NS 改成 cloudflare 給的兩個Nameserver (等待生效可能需要幾小時到72小時)  
2. Cloudflare 後台設定 DNS記錄
    1. 新增記錄 (按 add record)
    ![步驟1](https://hackmd.io/_uploads/SkthoDnzbe.png)
    ![步驟2](https://hackmd.io/_uploads/HkJCoD2Mbe.png)
    2. 選 CNAME 紀錄 
    ![步驟3](https://hackmd.io/_uploads/BJCbnwnzbl.png)
    4. 選擇名稱 (Name)
        (假設你的域名是`cat.me` 而你的名稱寫 `grass`)  
        那 `grass.cat.me` 就會是你用的網址  
    5. 選擇目標 (Target)
        `<YOUR_TUNNEL_UUID>.cfargotunnel.com`
    6. 按 save
那這樣 你就可以在 你的網站上看到你架的 judge 了


