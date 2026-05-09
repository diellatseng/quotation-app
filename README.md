# 報價管理系統 — Quotation Management System

工程報價單管理系統。支援客戶資料庫、工程範本、服務清單、議價記錄、版本追蹤，並可匯出 PDF 與發送 Email。

Construction quotation management system with client database, project templates, service catalog, negotiation tracking, versioning, PDF export, and email integration.

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

### 2️⃣ EmailJS 設定（Email 發送功能）

#### 建立帳號與服務 / Setup Account
1. 前往 [https://dashboard.emailjs.com](https://dashboard.emailjs.com) 註冊（免費 200 封/月）
2. 新增 Email Service → 選擇您的郵件服務（Gmail、Outlook 等）
3. 建立 Email Template：
   - Template ID 自訂（例如：`template_quotation`）
   - 範本變數（必須包含）：
     ```
     {{to_email}} — 收件人
     {{to_name}} — 收件人姓名
     {{quote_number}} — 報價編號
     {{client_name}} — 客戶名稱
     {{amount}} — 報價金額
     {{quote_date}} — 報價日期
     {{company_name}} — 您的公司名稱
     {{pdf_content}} — PDF 附件（Base64）
     ```
   - 範本內容範例：
     ```
     主旨：報價單 {{quote_number}} — {{company_name}}

     {{to_name}} 您好，

     隨信附上報價單 {{quote_number}}，報價金額為 {{amount}}。
     報價日期：{{quote_date}}

     如有任何問題，請隨時與我們聯繫。

     {{company_name}} 敬上
     ```

4. 複製以下資訊：
   - Public Key (在 Account → API Keys)
   - Service ID（您剛建立的服務）
   - Template ID（您剛建立的範本）

### 3️⃣ 環境變數設定

```bash
cp .env.example .env.local
```

編輯 `.env.local`，填入您的設定：

```env
# Supabase
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhb...your-key

# EmailJS
REACT_APP_EMAILJS_PUBLIC_KEY=your-public-key
REACT_APP_EMAILJS_SERVICE_ID=service_xxxxx
REACT_APP_EMAILJS_TEMPLATE_ID=template_xxxxx

# 公司資訊（會顯示在報價單上）
REACT_APP_COMPANY_NAME=某某建設顧問有限公司
REACT_APP_COMPANY_ADDRESS=高雄市某區某路123號
REACT_APP_COMPANY_PHONE=07-1234567
REACT_APP_COMPANY_FAX=07-7654321
REACT_APP_COMPANY_EMAIL=info@yourcompany.com
```

### 4️⃣ 安裝與啟動

```bash
npm install
npm start
```

瀏覽器會自動開啟 `http://localhost:3000`

### 5️⃣ 建立第一個使用者

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

4. ⚠️ **重要：** GitHub Pages 只能部署前端，EmailJS 會從瀏覽器直接呼叫。您的 `.env.local` 設定需要加入 GitHub Secrets 並在 build 時注入（或使用 Netlify / Vercel 等支援環境變數的服務）。

---

## 🎨 功能說明

| 功能 | 說明 |
|------|------|
| **登入驗證** | Supabase Auth，支援 Email + 密碼 |
| **客戶管理** | 客戶資料庫、聯絡人（1-to-many）、主要聯絡人標記 |
| **工程範本** | 預設服務內容範本，快速建立報價單 |
| **服務資料庫** | 服務項目 + 客戶準備清單（附件） |
| **報價單建立** | 6 步驟精靈：客戶 → 工程 → 付款 → 服務 → 確認 → 預覽 |
| **民國/西元** | 日期輸入支援切換，內部以西元儲存 |
| **付款方式** | 多階段付款，百分比自動計算金額 |
| **狀態管理** | 草稿 → 已報價 → 已確認 → 已封存 |
| **議價記錄** | 完整議價歷程、金額變更追蹤 |
| **版本控制** | 建立新版本報價單、差異標示（藍色 = 新增項目） |
| **PDF 匯出** | A4 格式，含報價單主頁 + 客戶準備清單附件 |
| **Email 發送** | 透過 EmailJS 直接寄送 PDF 附件 |
| **無障礙設計** | 字體放大/縮小、高對比模式、最小點擊目標 48px |
| **響應式** | 手機優先設計，支援各種螢幕尺寸 |

---

## 🗂️ 資料庫結構

```
clients                  → 客戶資料
  ├── id, company_name, address, phone, fax, email
  └── responsible_person_name, responsible_person_title

contact_persons          → 聯絡人（1-to-many → clients）
  ├── client_id, name, mobile, office_phone, fax, email
  └── is_primary

project_templates        → 工程範本
  └── name, description, category

services                 → 服務資料庫
  └── name, category, description

template_services        → 範本 ←→ 服務（many-to-many）
  └── template_id, service_id, sort_order

service_checklist_items  → 客戶準備清單（1-to-many → services）
  └── service_id, item_text, sort_order

quotations               → 報價單主檔
  ├── quote_number, version, parent_id (版本鏈)
  ├── status: 草稿 | 已報價 | 已確認 | 已封存
  ├── is_negotiating (bool tag)
  ├── client_id, contact_person_id
  ├── 工程資料：building_permit, land_section, project_scale...
  └── fee_amount, tax_included, quote_date, notes

quotation_services       → 報價單的服務內容
  ├── quotation_id, service_name, category
  ├── checklist_items (jsonb snapshot)
  └── is_added (bool — 差異標示用)

payment_stages           → 付款階段
  └── quotation_id, stage_name, percentage, amount

negotiation_log          → 議價記錄
  └── quotation_id, logged_at, old_amount, new_amount, notes
```

---

## 🛠️ 技術架構

**Frontend:**
- React 18 + React Router 6
- Noto Sans TC（Traditional Chinese font）
- html2canvas + jsPDF（PDF 匯出）
- EmailJS（Email 發送）

**Backend / DB:**
- Supabase (PostgreSQL + Auth + Row Level Security)

**Hosting:**
- GitHub Pages（或 Netlify / Vercel）

---

## ♿ 無障礙功能

- 基礎字體大小 18px（可調整 14–24px）
- 高對比模式切換
- 最小點擊目標 48×48px
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
3. 步驟 2：選擇工程範本（自動載入服務）
4. 步驟 3：設定付款階段（百分比需達 100%）
5. 步驟 4：調整服務內容 + 編輯客戶準備清單
6. 步驟 5：填寫報價編號、日期、金額
7. 步驟 6：預覽 → 匯出 PDF / 發送 Email

### 3. 議價與版本
- 報價單狀態 = **已報價** 後，可新增議價記錄
- 點擊「建立新版本」→ 複製並產生 v2
- 新版本可調整服務、金額，差異會以藍色標示
- Dashboard 只顯示最新版本，舊版本可在報價單內查看

---

## 🔧 常見問題 / FAQ

### Q: 如何新增更多管理員使用者？
A: 前往 Supabase Dashboard → Authentication → Invite User，輸入 Email 即可。

### Q: EmailJS 超過免費額度怎麼辦？
A: 免費版每月 200 封。如需更多，可升級 EmailJS 方案，或改用 Resend + Supabase Edge Function（參考文件）。

### Q: 如何修改報價單樣式？
A: 編輯 `src/components/A4Preview.jsx` 中的 `a4` 樣式物件。

### Q: 為什麼封存的報價單看不到？
A: Dashboard 預設隱藏已封存，點擊「顯示已封存」即可查看。

### Q: 可以同時使用多個公司嗎？
A: 目前公司資訊寫在 `.env`，單一公司。如需多公司，請在資料庫新增 `companies` 表並修改報價單邏輯。

---

## 📄 授權 / License

MIT License — 自由使用、修改、分發。

---

## 🙏 致謝

此專案使用以下開源技術：
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [EmailJS](https://www.emailjs.com/)
- [Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)
