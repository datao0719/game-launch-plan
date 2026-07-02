# 三大平台遊戲上線時程規劃（共用即時版）

一個多人可以同時打開、同時拖曳調整的遊戲上線排程板。任何人透過同一個網址打開，看到的都是同一份即時同步的排程；拖曳、新增、刪除標籤會立刻推送給所有正在瀏覽的人，並存進資料庫。

## 架構

- `server.js`：Node.js + Express + Socket.io。負責持有目前排程的唯一正確版本、驗證規則（客製獨家 / 首發優先）、即時廣播給所有連線的瀏覽器。
- `gameData.js`：平台、上線方式、月份欄位定義，以及原始試算表匯入的基準規劃（還原時會用到）。
- `store.js`：資料儲存層。有 `DATABASE_URL` 環境變數時使用 PostgreSQL（正式環境建議），沒有的話退回存成本機 `data/state.json`（僅適合本機測試，Railway 重新部署後可能遺失）。
- `public/index.html`：前端頁面，透過 Socket.io 即時收發排程狀態，不使用瀏覽器 localStorage。

## 部署到 Railway

1. 把這個資料夾推上一個 GitHub repo（`node_modules` 已被 `.gitignore` 排除，不用上傳）。
2. 到 [Railway](https://railway.app) 開一個新專案，選擇「Deploy from GitHub repo」，指向這個 repo。
3. **強烈建議**：在同一個 Railway 專案裡按「+ New」加一個 **PostgreSQL** 服務。Railway 會自動幫你的主服務注入 `DATABASE_URL` 環境變數，資料庫本身獨立於程式碼部署，重新部署、程式更新都不會遺失排程資料。
   - 如果不加 PostgreSQL，程式會用本機檔案儲存，可以先用，但下次重新部署（redeploy）時可能會被重置成最原始的試算表版本。
4. Railway 偵測到 `package.json` 後會自動用 Nixpacks 建置，執行 `npm start`；不需要額外設定 `PORT`，Railway 會自動注入，程式已經讀取 `process.env.PORT`。
5. 部署完成後，Railway 會給一個公開網址（例如 `xxxx.up.railway.app`），把這個網址分享給任何人，大家打開都是同一份即時同步的排程。

## 本機測試

```bash
npm install
npm start
# 開瀏覽器到 http://localhost:3000
```

沒有設定 `DATABASE_URL` 時會自動存成 `data/state.json`。

## 已內建的規則

- 只有遊戲類別為「客製遊戲」的標籤，才能放進某平台的「客製獨家」列；否則會被擋下並提示。
- 一款遊戲若已經以「客製遊戲」身分放進某平台的「客製獨家」，就不能再出現在其他兩個平台。
- 一款遊戲若已經出現在某平台的「首發」列，同名遊戲不能在其他平台於更早或相同的時間點上架。

## 已知限制

- 目前沒有登入或權限控管，任何知道網址的人都可以調整排程、刪除標籤，請留意分享對象。
- 「還原初始規劃」會立即影響所有正在瀏覽的人，且無法復原，請謹慎點擊。
