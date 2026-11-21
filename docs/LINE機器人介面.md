# K1 與 LINE 機器人（n8n）之間的資料格式

K1 是純網頁、資料存在瀏覽器裡，機器人碰不到。所以班長在 LINE 填的 BOM 先存在 n8n 的「收件匣」，K1 再去拿，由負責人確認後才加進 BOM。

```
K1「送出缺 BOM 清單」 → n8n 記下要問哪些機種 → 機器人推播給班長
班長在 LINE 內的表單填寫 → n8n 收件匣
K1「同步」拿收件匣 → 負責人確認／退回 → K1 回報結果 → 機器人通知班長
```

## 網址與驗證

- K1 的「LINE 收件匣」頁要設定兩樣東西（只存在瀏覽器，不寫進程式，因為程式碼是公開的）：
  - **機器人網址**：n8n 對外網址加 `/webhook`，例如 `https://xxxx.ngrok-free.dev/webhook`
  - **存取碼**：自訂一串密碼，n8n 端比對
- K1 每個請求都帶標頭 `X-K1-Key: 存取碼`，n8n 對不上就回 401
- K1 可能從 `file://` 或本機伺服器打開，n8n 回應要加 `Access-Control-Allow-Origin: *`，並處理 `OPTIONS` 預檢請求（允許標頭 `Content-Type, X-K1-Key`）
- 經過 ngrok 時，K1 會另外帶 `ngrok-skip-browser-warning: 1` 標頭，避免被 ngrok 的提示頁擋住，所以預檢也要允許這個標頭

## 1. 送出缺 BOM 清單（K1 → n8n）

`POST {機器人網址}/k1-bom-request`

```json
{
  "month": "2026-10",
  "partTypes": ["11200", "11201", "11100"],
  "models": [
    { "model": "DTZA16", "qty": 5400, "reason": "no-bom" },
    { "model": "KHIA91", "qty": 6240, "reason": "empty-bom" }
  ]
}
```

- `reason`：`no-bom` 代表 BOM 沒有這個機種；`empty-bom` 代表 BOM 有但部品全空白
- n8n 收到後取代舊清單，表單用 `partTypes` 產生欄位、用 `models` 做下拉選單
- 回應：`{ "ok": true, "count": 2 }`

## 2. 班長填寫的資料（LINE 表單 → n8n 收件匣）

每筆存成：

```json
{
  "id": "唯一編號",
  "model": "DTZA16",
  "parts": { "11200": "11200-ABC1-900", "11100": "" },
  "noMachining": false,
  "note": "備註",
  "submittedBy": "班長顯示名稱",
  "submittedById": "LINE 使用者編號",
  "submittedAt": "2026-11-21T08:30:00+08:00",
  "status": "pending"
}
```

- `parts` 的鍵是部品種類代號（BOM 欄名），值是件號；沒有的留空字串
- `noMachining: true` 代表班長確認這個機種不需要加工，`parts` 可以全空

## 3. 取得收件匣（K1 → n8n）

`GET {機器人網址}/k1-bom-inbox?status=pending`

回應：`{ "items": [ 上面格式的資料… ] }`

## 4. 回報確認結果（K1 → n8n）

`POST {機器人網址}/k1-bom-inbox/result`

```json
{ "id": "唯一編號", "status": "approved", "reason": "", "reviewer": "審核專員名稱", "reviewedAt": "2026-11-21T09:10:00+08:00" }
```

- 班長送出的資料**一律要經過審核專員確認**才會進 BOM；K1 收件匣頁只有確認或退回兩個動作
- `status`：`approved`（已加入 BOM）或 `rejected`（退回，`reason` 寫原因，必填）
- `reviewer`：在 K1 收件匣設定的審核專員名稱；每筆的審核人與時間也會留在 K1 的已處理紀錄
- n8n 更新那筆的狀態，並推播給填寫的班長，例如「DTZA16 已加入系統」或「DTZA16 被退回：件號格式不對」
- 回應：`{ "ok": true }`

## 沒有開 Docker 時怎麼測

K1 收件匣頁可以「從檔案匯入」：選一個 JSON 檔，內容就是第 3 點的回應格式。用來測試審核流程，不需要機器人。
