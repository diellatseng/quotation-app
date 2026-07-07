-- ============================================================
-- 案件管理系統 Schema (consolidated)
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- 適用於全新 Supabase 案件。若資料庫已存在，請勿重複執行整份腳本。
-- ============================================================


-- ── CLIENTS ───────────────────────────────────────────────────
CREATE TABLE clients (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name              TEXT NOT NULL,
  address                   TEXT,
  phone                     TEXT,
  fax                       TEXT,
  email                     TEXT,
  responsible_person_name   TEXT,
  responsible_person_mobile TEXT,
  responsible_person_title  TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTACT PERSONS (1-to-many → clients) ───────────────────────
CREATE TABLE contact_persons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  mobile        TEXT,
  office_phone  TEXT,
  fax           TEXT,
  email         TEXT,
  is_primary    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROJECT TEMPLATES ───────────────────────────────────────────
CREATE TABLE project_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SERVICES ────────────────────────────────────────────────────
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEMPLATE ↔ SERVICES (many-to-many) ──────────────────────────
CREATE TABLE template_services (
  template_id UUID REFERENCES project_templates(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES services(id) ON DELETE CASCADE,
  sort_order  INT DEFAULT 0,
  PRIMARY KEY (template_id, service_id)
);

-- ── SERVICE CHECKLIST ITEMS (1-to-many → services) ──────────────
CREATE TABLE service_checklist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID REFERENCES services(id) ON DELETE CASCADE,
  item_text   TEXT NOT NULL,
  sort_order  INT DEFAULT 0
);

-- ── COMPANY PROFILES (開立抬頭：公司／個人，供案件 / PDF 使用) ─────
CREATE TABLE company_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type  TEXT NOT NULL DEFAULT 'company'
                  CHECK (profile_type IN ('company', 'individual')),
  label         TEXT NOT NULL,
  name          TEXT NOT NULL,
  honorific     TEXT CHECK (honorific IS NULL OR honorific IN ('先生', '小姐')),
  national_id   TEXT,
  address       TEXT,
  phone         TEXT,
  fax           TEXT,
  email         TEXT,
  is_default    BOOLEAN DEFAULT FALSE,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_company_profiles" ON company_profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- ── BANK ACCOUNTS (匯款帳戶，供請款單 PDF 使用) ─────────────────
CREATE TABLE bank_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label           TEXT NOT NULL,
  bank_name       TEXT NOT NULL,
  branch_name     TEXT,
  account_name    TEXT NOT NULL,
  account_number  TEXT NOT NULL,
  notes           TEXT,
  is_default      BOOLEAN DEFAULT FALSE,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_bank_accounts" ON bank_accounts
  FOR ALL USING (auth.role() = 'authenticated');

-- ── PROJECTS ────────────────────────────────────────────────────
CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_name    TEXT,
  client_id         UUID REFERENCES clients(id) ON DELETE SET NULL,
  contact_person_id UUID REFERENCES contact_persons(id) ON DELETE SET NULL,
  company_profile_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
  building_permit   TEXT,
  land_section      TEXT NOT NULL UNIQUE,
  project_scale     TEXT,
  project_owner     TEXT,
  total_amount      NUMERIC(14,2) DEFAULT 0,
  tax_included      BOOLEAN DEFAULT FALSE,
  status            TEXT NOT NULL DEFAULT '未開工'
                      CHECK (status IN (
                        '未開工', '已開工', '暫停', '完工', '已刪除'
                      )),
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUOTATIONS ──────────────────────────────────────────────────
CREATE TABLE quotations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number            TEXT NOT NULL,
  version                 INT DEFAULT 1,
  parent_id               UUID REFERENCES quotations(id) ON DELETE SET NULL,
  status                  TEXT NOT NULL DEFAULT '草稿'
                            CHECK (status IN ('草稿', '已報價', '已確認', '已刪除')),
  is_negotiating          BOOLEAN DEFAULT FALSE,
  project_id              UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id               UUID REFERENCES clients(id) ON DELETE SET NULL,
  contact_person_id       UUID REFERENCES contact_persons(id) ON DELETE SET NULL,
  contact_person_snapshot JSONB,
  project_template_id     UUID REFERENCES project_templates(id) ON DELETE SET NULL,
  -- 工程資料
  building_permit         TEXT,
  land_section            TEXT,
  project_scale           TEXT,
  project_owner           TEXT,
  marketing_name            TEXT,
  -- 報價
  fee_amount              NUMERIC(14,2) DEFAULT 0,
  tax_included            BOOLEAN DEFAULT FALSE,
  quote_date              DATE DEFAULT CURRENT_DATE,
  notes                   TEXT,
  created_by              UUID REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS source_quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL;

-- ── QUOTATION SERVICES (line items) ─────────────────────────────
CREATE TABLE quotation_services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID REFERENCES quotations(id) ON DELETE CASCADE,
  service_id      UUID,
  service_name    TEXT NOT NULL,
  category        TEXT,
  description     TEXT,
  checklist_items JSONB DEFAULT '[]',
  sort_order      INT DEFAULT 0,
  is_added        BOOLEAN DEFAULT FALSE,
  diff_status     TEXT CHECK (diff_status IN ('added', 'modified', 'removed'))
);

-- ── PAYMENT STAGES ──────────────────────────────────────────────
CREATE TABLE payment_stages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id  UUID REFERENCES quotations(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  stage_name    TEXT NOT NULL,
  percentage    NUMERIC(5,2) DEFAULT 0,
  amount        NUMERIC(14,2) DEFAULT 0,
  sort_order    INT DEFAULT 0
);

-- ── DISBURSEMENTS (代墊明細 → payment_stages) ───────────────────
CREATE TABLE disbursements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_stage_id UUID NOT NULL REFERENCES payment_stages(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  amount           NUMERIC(14,2) DEFAULT 0,
  is_preset        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── INVOICES (1 per payment stage) ────────────────────────────────
CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  payment_stage_id UUID NOT NULL REFERENCES payment_stages(id) ON DELETE CASCADE,
  invoice_number   TEXT,
  status           TEXT NOT NULL DEFAULT '草稿'
                     CHECK (status IN ('草稿', '已請款', '已收款')),
  invoiced_at      DATE,
  received_at      DATE,
  notes            TEXT,
  returned_documents TEXT,
  bank_account_id  UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (payment_stage_id)
);

-- ── NEGOTIATION LOG ─────────────────────────────────────────────
CREATE TABLE negotiation_log (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id            UUID REFERENCES quotations(id) ON DELETE CASCADE,
  logged_at               TIMESTAMPTZ DEFAULT NOW(),
  old_amount              NUMERIC(14,2),
  new_amount              NUMERIC(14,2),
  contact_person_snapshot JSONB,
  notes                   TEXT,
  logged_by               UUID REFERENCES auth.users(id)
);


-- ── CONTRACTS (1 per confirmed quotation) ───────────────────────
CREATE TABLE contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id     UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  contract_number  TEXT,
  project_item     TEXT NOT NULL DEFAULT '建管程序業務及使用執照代辦',
  site_name        TEXT NOT NULL DEFAULT '',
  signed_at        DATE,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (quotation_id)
);

-- ── AUTO updated_at ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_project_templates_updated_at
  BEFORE UPDATE ON project_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_quotations_updated_at
  BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── ROW LEVEL SECURITY ────────────────────────────────────────────
ALTER TABLE clients                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_persons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE services                ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_services       ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects                ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_stages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices                ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts                 ENABLE ROW LEVEL SECURITY;

-- All authenticated users can do everything (internal app)
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clients', 'contact_persons',
    'project_templates', 'services',
    'template_services', 'service_checklist_items', 'projects',
    'quotations', 'quotation_services', 'payment_stages',
    'disbursements', 'invoices', 'negotiation_log', 'contracts'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "auth_all_%s" ON %I FOR ALL USING (auth.role() = ''authenticated'')',
      tbl, tbl
    );
  END LOOP;
END $$;
