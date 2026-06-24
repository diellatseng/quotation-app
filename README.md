# 專案管理系統 — Project Management System

工程專案管理系統。整合客戶資料庫、工程範本、服務清單與報價流程，並可匯出 PDF；後續將擴充發票模組。

Construction project management system with client database, project templates, service catalog, quotation workflow, and PDF export; invoice module planned.

---

## 🚀 快速開始 / Quick Start

### 1️⃣ Supabase 設定

#### 建立專案 / Create Project
1. 前往 [https://app.supabase.com](https://app.supabase.com) 註冊免費帳號
2. 建立新專案（New Project）
3. 前往 **SQL Editor** → New Query
4. 複製並執行 `supabase/schema.sql` 中的完整 SQL

#### 取得 API 金鑰 / Get API Keys
1. 前往 **Project Settings → API**
2. 複製以下資訊：
   - `Project URL` (例如：`https://xxxxx.supabase.co`)
   - `anon` / `public` key

### 2️⃣ 環境變數設定

```bash
cp template.env .env.local
```

編輯 `.env.local`，填入您的設定：

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...your-key

# PDF export server (local Puppeteer service)
VITE_PDF_SERVER_URL=http://localhost:3001

# 公司資訊（會顯示在報價單上）
VITE_COMPANY_NAME=某某建設顧問有限公司
VITE_COMPANY_ADDRESS=高雄市某區某路123號
VITE_COMPANY_PHONE=07-1234567
VITE_COMPANY_FAX=07-7654321
VITE_COMPANY_EMAIL=info@yourcompany.com
```

> Vite 只會將以 `VITE_` 開頭的變數注入前端。請勿使用舊版 Create React App 的 `REACT_APP_*` 前綴。

### 3️⃣ 安裝與啟動

```bash
# Frontend
npm install
npm start

# PDF server (separate terminal — required for PDF export)
cd server
npm install
npm start
```

瀏覽器會自動開啟 `http://localhost:3000`（前端）。PDF 匯出需 PDF server 在 `http://localhost:3001` 運行。

### 4️⃣ 建立第一個使用者

1. 前往 Supabase Dashboard → **Authentication → Users**
2. 點擊 **Invite User**
3. 輸入您的 Email，系統會發送邀請信
4. 點擊邀請信中的連結設定密碼
5. 使用 Email + 密碼登入系統

---

## 📦 部署至 GitHub Pages

1. 在 `package.json` 中修改 `homepage` 欄位：
   ```json
   "homepage": "https://你的帳號.github.io/你的repo名稱"
   ```

2. 執行部署：
   ```bash
   npm run deploy
   ```

3. 確認 GitHub Repo → **Settings → Pages** 已啟用 gh-pages branch

4. ⚠️ **重要：** GitHub Pages 只能部署前端。PDF 匯出需獨立的 Puppeteer 伺服器（`server/`），無法在靜態 Pages 上執行。部署時請將 `VITE_*` 變數在 build 前寫入 `.env.local`，或改用 Netlify / Vercel 等支援環境變數的服務。

---

## 🎨 功能說明

| 功能 | 說明 |
|------|------|
| **登入驗證** | Supabase Auth，支援 Email + 密碼 |
| **客戶管理** | 客戶資料庫、聯絡人（1-to-many）、主要聯絡人標記 |
| **工程範本** | 預設服務內容範本，快速建立報價單 |
| **服務資料庫** | 服務項目 + 客戶準備清單（附件） |
| **報價單建立** | 4 步驟精靈：客戶 → 工程 → 服務 → 確認 |
| **民國/西元** | 日期輸入支援切換，內部以西元儲存 |
| **付款方式** | 多階段付款，百分比自動計算金額 |
| **狀態管理** | 草稿 → 已報價 → 已確認 → 已結案 |
| **版本控制** | 建立新版本報價單、差異標示（功能旗標，預設關閉） |
| **PDF 匯出** | A4 格式，含報價單主頁 + 客戶準備清單附件（需 PDF server） |
| **無障礙設計** | 字體放大/縮小、高對比模式 |
| **響應式** | 手機優先設計，支援各種螢幕尺寸 |

---

## 🗂️ 資料庫結構

完整 schema 見 `supabase/schema.sql`（新專案一次性執行）。主要資料表：

```
projects                 → 專案主檔（地號、狀態、合約金額）
  └── status: 草稿 | 已報價 | 已確認報價 | 進行中 | 完工 | 暫停 | 已刪除

quotations               → 報價單（project_id 連結專案）
  └── status: 草稿 | 已報價 | 已確認 | 已結案 | 已刪除

payment_stages           → 付款階段（quotation_id + project_id）
disbursements            → 代墊明細（→ payment_stages）
invoices                 → 發票（→ project + payment_stage，每階段一張）

clients / contact_persons / project_templates / services / …
```

---

## 🛠️ 技術架構

**Frontend:**
- React 18 + Vite + React Router 6
- Tailwind CSS v4 + shadcn/ui
- Noto Sans TC（Traditional Chinese font）

**PDF export:**
- Express + Puppeteer (`server/`)

**Backend / DB:**
- Supabase (PostgreSQL + Auth + Row Level Security)

**Hosting:**
- GitHub Pages（前端靜態檔；PDF server 需另行部署）

---

## ♿ 無障礙功能

- 基礎字體大小 18px（可調整 14–24px）
- 高對比模式切換
- ARIA labels + role attributes
- 鍵盤導航支援
- Screen reader 友善

---

## 📝 使用流程

### 1. 管理後台準備
1. **服務資料庫** — 新增常用服務項目 + 客戶準備清單
2. **工程範本** — 建立範本並連結服務（例如：住宅大樓 → 10 項服務）
3. **客戶資料庫** — 新增客戶 + 聯絡人

### 2. 建立報價單
1. Dashboard → **新增報價單**
2. 步驟 1：選擇客戶 + 聯絡人
3. 步驟 2：填寫工程資料、選擇範本（自動載入服務）
4. 步驟 3：調整服務內容 + 編輯客戶準備清單
5. 步驟 4：填寫報價編號、日期、金額 + 設定付款階段（百分比需達 100%）→ 儲存

### 3. 檢視與匯出
- 報價單詳情頁可預覽報價單、服務明細、客戶準備清單
- 點擊 **匯出 PDF**（需 PDF server 運行中）

---

## 🔧 常見問題 / FAQ

### Q: 如何新增更多管理員使用者？
A: 前往 Supabase Dashboard → Authentication → Invite User，輸入 Email 即可。

### Q: PDF 匯出失敗怎麼辦？
A: 確認 `server/` 已啟動且 `VITE_PDF_SERVER_URL` 指向正確位址（預設 `http://localhost:3001`）。

### Q: 如何修改報價單樣式？
A: 編輯 `src/components/A4Preview.jsx` 與 `src/styles/components/A4Preview.css`。

### Q: 為什麼結案的報價單看不到？
A: Dashboard 預設隱藏已結案，點擊「顯示已結案」即可查看。

### Q: 可以同時使用多個公司嗎？
A: 目前公司資訊寫在 `.env.local` 的 `VITE_COMPANY_*`，單一公司。如需多公司，請在資料庫新增 `companies` 表並修改報價單邏輯。

---

## 📄 授權 / License

MIT License — 自由使用、修改、分發。

---

## 🙏 致謝

此專案使用以下開源技術：
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)
