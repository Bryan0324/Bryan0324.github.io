# 設定操作與驗證

網站使用根目錄 `_config.yml`。主題預設值在 `src/lib/theme-defaults.mjs`，網站與主題選項由 `src/lib/config.mjs` 載入。

修改 YAML 後重新啟動 `npm run dev`；正式網站需要重新建置、部署。瀏覽器重新整理不會替代這兩個步驟。

## 網站設定

| 設定 | 實際作用 |
| --- | --- |
| `title`、`subtitle`、`description`、`author` | 頁面標題、SEO、側欄與頁尾。文章自己的 description 優先於網站描述。 |
| `language` | HTML `lang` 與標籤的語系排序；目前 UI 文案是繁體中文，不是多語翻譯開關。 |
| `timezone` | 文章日期、歸檔、未來文章判斷；運行時間未指定時差時，也依此時區解析。 |
| `url` | canonical、Open Graph 與文章版權連結的網站網址。GitHub 自訂網域仍另由 `CNAME` 管理。 |
| `permalink` | 文章路徑，可用 `:year`、`:month`、`:day`、`:title`、`:id`；文章 frontmatter 的 permalink 優先。修改會改變既有連結與 pathname 留言對應。 |
| `future` | `false` 排除未到發表日期的文章；草稿仍不發布。 |
| `index_generator.per_page` | 首頁每頁文章數；`0` 不分頁。 |
| `per_page` | 歸檔、分類、標籤列表每頁文章數；`0` 不分頁。 |
| `category_map`、`tag_map` | 將名稱映射為分類／標籤的 URL 路徑；鍵必須與文章名稱完全一致。 |

## 主題設定（以下均位於 `theme:`）

| 設定 | 實際作用與條件 |
| --- | --- |
| `mode` | `light`、`dark`、`sunset`、`auto`（作業系統）、`time`（訪客當地時間）。訪客的 `localStorage.darken-mode` 手動選擇優先；測試預設值前可清除此鍵。 |
| `mode_toggle.enable` | 顯示／隱藏側欄模式按鈕。 |
| `colors.primary` | 主色及其衍生亮色、透明色，使用 `#RGB` 或 `#RRGGBB`。 |
| `colors.bg`、`colors.selection_bg` | 日間頁面底色、選取文字背景。背景圖啟用時會覆蓋頁面底色。 |
| `colors.tag_start_color`、`colors.tag_end_color` | 標籤雲依文章數插值的起訖顏色，使用十六進位色碼。 |
| `colors.dark.block` | 夜間文章、卡片與側欄底色，使用十六進位色碼。 |
| `colors.sunset.bg/block/text/link/banner` | 夕陽模式底色、區塊、文字、連結與橫幅；相關透明底色和分頁配色也會跟著改變。 |
| `favicon` | 頁籤圖示；留空使用 `/grass_cat.png`。 |
| `404.message` | 找不到頁面的訊息；留空使用預設文案。 |
| `sidebar.bg_image/dark_bg_image/sunset_bg_image`、`bg_position` | 三種模式的側欄背景與位置。 |
| `sidebar.tagcloud.enable/amount` | 標籤雲開關與最多顯示數量；`0` 不顯示標籤。`/tags/` 不受側欄數量限制。 |
| `toc.list_number/min_depth/max_depth/collapse` | 目錄編號、標題層級範圍（1–6）、子目錄折疊。文章 `toc: false` 優先。 |
| `avatar.enable/url/rounded` | 頭像開關、網址與圓形／方形外觀。 |
| `social[].name/link/icon/color` | 社群連結名稱、目標、圖示與顏色。 |
| `pages[].name/url/icon/color` | 側欄額外頁面連結。 |
| `anonymous_image` | 友鏈沒有提供 avatar 時的預設圖片；不是所有圖片載入失敗的替代圖。 |
| `menu.home.path/icon`、`menu.list[].type/path/icon`、`menu.custom.title/path/icon` | 導覽連結與圖示。type 選擇歸檔／分類／標籤計數；不會重新命名實際路由。custom 可設為 null。 |
| `archive.last_word` | 列表最後一頁的結尾文字。 |
| `tags`、`categories` | 文章分類／標籤連結的自訂色；名稱大小寫需完全相同（`Python` 不等於 `python`）。標籤雲顏色由 colors 的起訖色控制。 |
| `post_card.opacity` | 卡片底色透明度（0–1），不是整張卡片連文字一起透明。 |
| `post_meta.item_text/created_at/updated_at/categories/tags` | 文章資訊文字、建立日期、更新日期、分類與標籤。更新日期只在有 updated 且與建立日期不同時顯示。 |
| `codeblock.prismjs.line_number` | 程式碼區塊行號。 |
| `creative_commons.license/language/post` | 文章授權種類、授權連結語言與版權區塊開關。 |
| `icons.category/tag` | 分類與標籤圖示。現有圖示元件使用內建 Remix Icon，名稱格式為 `ri:名稱`。 |
| `banner.enable/title/border` | 首頁第一頁橫幅、文字與邊框。 |
| `banner.cloud.enable/color`、`banner.go_down.enable/icon` | 雲浪開關與顏色、向下按鈕開關與圖示；需要 banner.enable。 |
| `font.cdn.enable/lib` | 額外字體樣式表開關與 URL 清單；字體能否下載仍依外部服務。 |
| `font.serif.family/weight`、`font.sans_serif.family/weight`、`font.monospace.family` | 標題／正文／程式碼字體與字重。設定 family 不會自動下載字體。 |
| `fireworks.enable/colors` | 點擊煙火開關與 RGB 字串色盤；訪客啟用減少動態效果時停用。 |
| `cursor.enable/default/pointer/text` | 自訂一般／連結／輸入游標；啟用後使用對應圖片 URL。 |
| `smoothScroll` | 錨點平滑捲動；減少動態效果偏好優先。 |
| `scrollreveal.enable` | 文章卡片與圖片進入畫面時的動畫；減少動態效果偏好優先。 |
| `bg_image.enable/url/dark/sunset/opacity` | 全站背景圖開關、三種模式的圖與透明度。 |
| `footer.since`、`footer.icon.name/animated/color` | 版權起始年與頁尾圖示動畫、顏色。 |
| `footer.powered.enable` | Astro／Yun 技術資訊開關。 |
| `footer.live_time.enable/prefix/suffix/start_time` | 運行時間開關、前後文案與起算時間。可明確指定 `Z` 或 `+08:00`。 |
| `search.modal/bg_image/dark_bg_image/placeholder` | modal=true 使用毛玻璃；false 使用指定圖片。搜尋仍以 dialog 開啟。需要 local_search.enable。 |
| `local_search.enable` | 搜尋按鈕與介面開關；靜態搜尋索引仍會產生。 |
| `mermaid.enable` | Mermaid 圖表渲染開關，需文章中有 mermaid 區塊。 |
| `comment.enable`、`giscus.enable` | 兩者均為 true 且文章允許 comments 才載入留言。 |
| `giscus.repo/repo-id/category/category-id/mapping/reactions-enabled/emit-metadata/lang/input-position/strict` | 傳送給 Giscus 的官方設定；repo、ID 與分類必須對應實際 GitHub Discussions。 |
| `giscus.theme` | `auto` 隨網站模式；其他值（如 light、transparent_dark、自訂 CSS URL）直接傳給 Giscus，不再被網站強制覆蓋。 |
| `giscus.loading` | lazy 接近留言區才載入；eager 進入頁面即載入。 |

## 可重跑的驗證

- `npm test`：配色衍生、CSS 變數完整性、Giscus eager/lazy 與主題同步等單元測試。
- `npm run verify:config`：在臨時目錄使用獨立快取建立測試文章，執行三組設定建置：功能關閉、自訂值、數量零值／子功能開關。不改寫工作目錄的設定與文章。
- `npm run build && npm run verify`：檢查目前設定產生的文章網址、搜尋與本地資源。網址驗證依目前 permalink、timezone、future 設定計算。

外部圖片、字體與 Giscus 的服務可用性不等同於設定接線驗證；後者確認站點有正確輸出／傳送設定值。
