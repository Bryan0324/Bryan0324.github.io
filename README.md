# Astro Yun · 草貓筆記

將本站客製化的 Hexo Yun 移植為 Astro 靜態網站。頁面以 `.astro` 元件呈現，Markdown / MDX 透過 Astro Content Collections 載入，React 圖表以 `client:visible` 按需啟用。

## 開始使用

需要 Node.js 22.12 以上，使用 npm 與 `package-lock.json` 安裝：

```sh
npm ci
npm run dev
```

- `npm run check`：Astro / TypeScript 檢查
- `npm test`：網址相容性測試
- `npm run build`：產生 `dist/`
- `npm run verify`：建置後檢查文章網址、站內連結、靜態資源、搜尋、數學與 React hydration
- `npm run verify:dev`：開發伺服器啟動後，檢查首頁確實載入已編譯的 Yun CSS（預設 `http://localhost:4321`）
- `npm run preview`：預覽正式建置

GitHub Pages workflow 會檢查、建置並發佈 `dist/`。儲存庫 Pages 的來源需設為 **GitHub Actions**。

## 寫文章與設定

- 文章：`source/_posts/<slug>/index.{md,mdx}`，每篇文章一個資料夾，可將圖片與文章放在同一資料夾並以相對路徑引用（例如 `./image.png`）。必填 `title`、`date`；支援 `description`、`updated`、`tags`、`categories`、`comments`、`toc`、`top` / `sticky`、`hide`、`draft`、`slug`、`permalink`。
- `draft: true` 不產生頁面；`hide: true` 產生頁面但不列入清單、搜尋與標籤；空白檔案略過。
- 頁面：`source/about/`、`source/friends/` 等。`index.md(x)` 對應目錄首頁，其餘對應 `.html`，例如 `/about/site.html`。
- 其他靜態資源：放在 `source/`，例如 `source/grass_cat.png`。建置時自動收集至 `.astro-static/`；請勿直接編輯該目錄。文章圖片建議放在文章資料夾內。
- 網站設定：`_config.yml` 的標題、作者、語言、時區、網址、文章網址格式與每頁數量。
- 主題設定：`_config.yun.yml`，預設值來自 `themes/yun/_config.yml`。修改 YAML 後重新啟動開發伺服器。
- React 元件：`source/components/`，MDX 內以相對路徑匯入。移植層會為大寫名稱的 JSX 元件補上 `client:visible`，亦可自行指定 `client:load` 等指令。

文章網址保留 `/年/月/日/原檔名/`（含大小寫），日期以網站時區解析，既有 Giscus `pathname` 討論可繼續使用。支援既有 `{% post_link ... %}`、程式碼中的 `{% raw %}` 標記、`shell=` 語言名稱，以及數學公式與 Mermaid 圖表。

## 主題結構

```text
src/layouts/Base.astro       HTML 外框、SEO、全站配置
src/components/             側欄、橫幅、文章卡片、留言與分頁
src/pages/[...path].astro    文章、頁面、歸檔、分類與標籤路由
src/pages/search.json.ts     靜態全文搜尋索引
src/scripts/client.ts       模式切換、搜尋、目錄、複製與煙火
src/scripts/fireworks.ts    原版 Canvas 圓形粒子與擴散圓環
src/styles/astro.css         Astro 適配樣式
integrations/yun.mjs         原始 Stylus 編譯與靜態資源收集
integrations/remark-hexo.mjs Hexo Markdown 相容層
integrations/rehype-yun-code.mjs Prism 程式碼行號
```

已移植：Yun 直排首頁與雲浪、響應式側欄、文章／分頁／歸檔／分類／標籤、目錄、友鏈、全文搜尋、日／夕陽／夜間與 auto/time 模式、Giscus 主題同步、程式碼高亮與複製、數學公式、Mermaid、React 互動圖表、點擊煙火、運行時間與 404。

外觀沿用原主題的卡片間距、側欄、圖示、標籤雲、歸檔時間軸、友鏈卡片與全螢幕搜尋。首頁僅在文章有 `<!-- more -->` 時顯示摘要與閱讀更多，`description` 顯示於標題下方。點擊特效採用原版的 20 顆圓形粒子、擴散圓環、尺寸與緩動時間；程式碼使用 Prism 配色及行號。

原主題樣式直接由 `themes/yun/source/css/` 編譯，不需要 Hexo 執行環境。原始 Pug 與 Hexo scripts 留作移植參考；未啟用的 Hexo 外掛（例如 Algolia、相簿、播放器、其他留言服務）尚未移植，不能直接靠舊設定啟用。這是本站的 Astro starter，尚非發佈至 npm 的主題套件。複用時一併保留 `src/`、`integrations/`、設定檔與 `themes/yun/` 的樣式、預設設定及授權檔。

Yun 原始主題 © YunYouJun，採 MIT License，詳見 `themes/yun/LICENSE`。
