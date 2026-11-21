# K1 組車加工負荷系統

回覆一律用繁體中文，避免英文術語；非用不可時附中文說明。

## 系統是什麼

純前端網頁，沒有後端、沒有建置步驟。用瀏覽器打開 `index.html` 就能用。

| 檔案 | 內容 |
|---|---|
| `index.html` | 版面：側欄、各分頁、對話框、指令面板、圖示 |
| `app.js` | 全部邏輯（約 3,800 行），資料存在瀏覽器 localStorage（鍵名開頭 `k1_`） |
| `style.css` | 樣式，顏色用 `:root` 變數，深色模式在 `:root[data-theme="dark"]` |
| `libs/xlsx.full.min.js` | 讀寫 Excel 的函式庫，不要改 |
| `D:\排產系統\K1資料\`（專案外） | 使用者的 Excel 資料，見下方「資料檔」。**不在專案裡，永遠不上傳** |
| `tools/check-plan.js` | 每月組車計畫檢查程式（Node，不用 AI），見「每月更新流程」 |
| `.claude/agents/` | 四個小助理的設定，見「分工規則」 |

### app.js 主要區塊（用搜尋找，不要整份讀）

- `// ===== STORAGE =====`：各資料的讀寫函式（`loadBOM`、`loadPartLines`…）
- `normalizeModelCode`、`buildBOMLookup`：機種代號正規化（去星號、去國別）
- `importExcel`、`buildDateColumns`：組車計畫匯入（日期從 G 欄開始）
- `calculateDailyParts`：每日部品數量
- `calculateLineLoad`、`renderLineLoad`、`exportLineLoad`：加工線負荷頁
- `calculateMachineLoad`、`calculateGroupLoad`、`renderCapacityLineSettings`：產能負荷
- `// ===== 介面元件 =====`：`toast`、`openDialog`（`uiAlert`／`uiConfirm`／`uiPrompt`）、主題、指令面板
- 原生 `alert`／`confirm`／`prompt` 已全部換掉，新程式請用 `await uiConfirm(...)` 等
- `// ===== LINE 收件匣`：班長在 LINE 填的 BOM（`syncLineInbox`、`approveInboxItem`、`rejectInboxItem`、`sendMissingBOMList`）。**一律經審核專員確認才寫進 BOM**。與 n8n 的資料格式見 `docs/LINE機器人介面.md`
- `exportDailyDemand`：各部品每日需求轉出 Excel（每月一張表＋加工線日合計）
- 「不需加工」機種存在 `k1_no_machining_models`，加工線負荷不再列為待補

## LINE 機器人（n8n）

- 架在使用者電腦的 Docker：`%USERPROFILE%\Documents\Docker`（`docker-compose.yaml`），n8n 透過 ngrok 對外，既有流程有「小蘇 LINE 客服」
- 使用者的電腦、Docker、ngrok 都要開著，機器人才能用
- 班長填寫用 **LINE 內開的表單**（不要用 Google 表單，有人手機不能用）
- n8n 流程「K1 ⑦ BOM 收件匣」（編號 `K1BomInbox00001`），匯入檔 `Documents\Docker\n8n\K1-7-BOM收件匣.json`；存取碼、LIFF 編號、測試模式都在流程的「設定」節點。改完用 `docker exec automation-n8n-1 n8n import:workflow --input=/home/node/.n8n-files/K1-7-BOM收件匣.json` 再 `n8n publish:workflow --id=K1BomInbox00001`
- 表單網頁 `Documents\Docker\k1-form\index.html`，由 Caddy 直接提供（網址 `/k1-form/`）。**不要改回由 n8n 回傳**：n8n 會把網頁隔離，LINE 登入元件會壞
- 存取碼存在 `D:\排產系統\K1資料\機器人存取碼.txt`
- LINE 設定（2026-11-21 完成，已發布）：官方帳號 `@247ttncd`「機三小助理 小蘇」（舊名吉毅卡哇，Provider `my-radar`）；LINE Login channel `2012734863`「K1補BOM表單」；LIFF 編號 `2012734863-On4fJIei`，班長開啟網址 `https://liff.line.me/2012734863-On4fJIei`；測試模式已關
- 免費 ngrok 第一次開網頁會跳提示頁，按「Visit Site」即可
- LINE 與 n8n 的金鑰、存取碼只放在 n8n，**不可寫進 K1 程式**（GitHub 是公開的）；K1 端的網址與存取碼只存在瀏覽器

## 業務規則（使用者已確認，不要重問）

- 目標：從每月組車計畫，依 BOM 展開部品，算出每條**加工線**（A～S LINE 與上毅、瑋廷等協力廠）的每日、每月負荷
- 負荷單位先用**件數**；要算工時或負荷率，需先請使用者補部品的 OP、設備、NT
- 跨月日期（例如 9 月表裡的 8/27～8/31）**依實際日期歸月**
- 組車計畫的 AE-0 段也要算進去
- 匯入新月份：只取代該檔案涵蓋的日期，其他月份保留

## 資料檔（`D:\排產系統\K1資料\`）

資料夾在專案外（與 `k1-bom-tool` 同一層），含公司計畫與人名，**任何資料檔都不可放進專案、不可上傳 GitHub**。`.gitignore` 也擋了 `data/` 與所有 Excel／CSV。

- `BOM主檔.xlsx`：機種 × 部品種類代號（欄名是 11200、21201 這類數字）。注意 N 欄目前有資料但沒有欄名，系統會忽略
- `加工部品主檔.xlsx`：部品 → 加工線別、素材廠商、擔當人員
- `組車計畫9-0.xlsx`：一張「AE線」表，分 AE-1、AE-2…AE-0 多段，B 欄為 NO 的列是日期表頭
- `設備主檔_15條線整理完成.xlsx`：設備 → 所屬 LINE
- `.檢查紀錄.json`、`每月更新清單_年-月.md`：每月檢查產生的紀錄與清單

## 每月更新流程

使用者每月會換新的組車計畫，並跟著更新機種（BOM）、組車代號、部品（加工部品主檔）。

1. 使用者把新的 `組車計畫*.xlsx` 放進 `D:\排產系統\K1資料\`
2. 交給 `monthly-reminder` 小助理：執行 `node tools/check-plan.js`，產生 `D:\排產系統\K1資料\每月更新清單_年-月.md`
3. 把清單重點告訴使用者，請他在 Excel 補 BOM 與部品主檔
4. 使用者補好後，在網頁依序轉入 BOM、加工部品主檔，再匯入組車計畫
5. 需要時交給 `ui-checker` 確認「加工線負荷」頁的待補資料有減少

`tools/check-plan.js` 是純程式檢查（不用 AI），計算規則與網頁版相同。它預設讀 `D:\排產系統\K1資料\`（可用環境變數 `K1_DATA` 改），並把每份計畫用到的組車代號與部品記在該資料夾的 `.檢查紀錄.json`，下個月用來比較新增了什麼。只想看看、不想留紀錄時加 `--no-save`。

## 怎麼測試

- 不要用 `file://` 開（預覽視窗裡 localStorage 不能用）。用上層資料夾 `D:\排產系統\.claude\launch.json` 的 `k1` 本機伺服器（埠 5173）
- 伺服器的根目錄是 `D:\排產系統`：系統網址 `http://localhost:5173/k1-bom-tool/`，測試資料用 `fetch('/K1資料/檔名.xlsx')` 取得
- 瀏覽器會快取舊檔，改完要強制重新載入（`fetch(檔名, {cache:'reload'})` 後再 `location.reload()`）
- 改完 `app.js` 先跑 `node --check app.js`

## 工作習慣

- 一個分支只做一件事。分支名稱 `類別/英文簡短描述`（feature、fix、docs、chore）
- 提交訊息 `類別: 中文描述`（feat、fix、docs、chore）
- PR 內文三段：這次改了什麼／為什麼要改／怎麼驗證
- 合併方式：建立合併提交，合併後刪掉分支

## 分工規則（省 token）

主對話負責：理解需求、設計、改程式、跟使用者確認。下面三類工作**交給小助理**，用 Agent 工具指定對應的 `subagent_type`：

| 工作 | 交給 | 模型 | 何時交 |
|---|---|---|---|
| 開分支、提交、推上去、開 PR、合併、刪分支 | `git-helper` | Haiku | 使用者同意後才交；交辦內容寫清楚要做哪幾步 |
| 找某功能在 app.js 哪幾行、列出相關函式 | `code-finder` | Haiku | 需要定位程式、又不想把整份檔案讀進主對話時 |
| 開本機伺服器、在瀏覽器實測、截圖檢查畫面 | `ui-checker` | Sonnet | 改完介面或計算、要驗證時 |
| 新月份組車計畫的檢查與更新清單 | `monthly-reminder` | Haiku | 使用者說新計畫放進去了、或要做每月更新時 |

- **要先問使用者的事，主對話先問完再交辦**：小助理沒辦法問使用者。推上去、合併、刪分支都屬於要先確認的事
- 交辦內容要自給自足：寫清楚檔案、要做的步驟、做完要回報什麼
- 只有一行指令的小事（例如 `git status`）主對話自己做，不必交辦
- 小助理回報後，主對話要檢查結果（例如看 `git log`），再告訴使用者
