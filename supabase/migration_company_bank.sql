-- ============================================================
-- Incremental migration: company_profiles + bank_accounts
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS)
-- ============================================================

-- ── COMPANY PROFILES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  fax         TEXT,
  email       TEXT,
  is_default  BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_company_profiles" ON company_profiles;
CREATE POLICY "auth_all_company_profiles" ON company_profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- ── BANK ACCOUNTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
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

DROP POLICY IF EXISTS "auth_all_bank_accounts" ON bank_accounts;
CREATE POLICY "auth_all_bank_accounts" ON bank_accounts
  FOR ALL USING (auth.role() = 'authenticated');

-- ── FK columns on existing tables ─────────────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS company_profile_id UUID
  REFERENCES company_profiles(id) ON DELETE SET NULL;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS bank_account_id UUID
  REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- 匯款帳戶改為請款單使用；若先前加在 quotations 上可移除
ALTER TABLE quotations DROP COLUMN IF EXISTS bank_account_id;

-- ── updated_at triggers ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER trg_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
