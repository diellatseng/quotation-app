-- ============================================================
-- Migration v2: Add projects, disbursements, invoices
--               + alter quotations and payment_stages
-- Run in Supabase SQL Editor.
-- Existing tables (clients, contact_persons, project_templates,
-- services, template_services, service_checklist_items,
-- quotations, quotation_services, payment_stages,
-- negotiation_log) are NOT touched except where noted.
-- ============================================================


-- ── 1. NEW TABLE: projects ────────────────────────────────────
CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  client_id         UUID REFERENCES clients(id) ON DELETE SET NULL,
  contact_person_id UUID REFERENCES contact_persons(id) ON DELETE SET NULL,
  building_permit   TEXT,
  land_section      TEXT,
  project_scale     TEXT,
  project_owner     TEXT,
  total_amount      NUMERIC(14,2) DEFAULT 0,
  tax_included      BOOLEAN DEFAULT FALSE,
  status            TEXT NOT NULL DEFAULT '已報價'
                      CHECK (status IN ('已報價','進行中','完工','暫停')),
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_projects" ON projects
  FOR ALL USING (auth.role() = 'authenticated');


-- ── 2. ALTER: quotations — add project_id ────────────────────
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;


-- ── 3. ALTER: payment_stages — add project_id, keep quotation_id for now ──
-- We add project_id alongside the existing quotation_id.
-- Drop quotation_id only after you've verified all data is correct.
ALTER TABLE payment_stages
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;


-- ── 4. NEW TABLE: disbursements ───────────────────────────────
CREATE TABLE disbursements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_stage_id UUID NOT NULL REFERENCES payment_stages(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  amount           NUMERIC(14,2) DEFAULT 0,
  is_preset        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_disbursements" ON disbursements
  FOR ALL USING (auth.role() = 'authenticated');


-- ── 5. NEW TABLE: invoices ────────────────────────────────────
CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  payment_stage_id UUID NOT NULL REFERENCES payment_stages(id) ON DELETE CASCADE,
  invoice_number   TEXT,
  status           TEXT NOT NULL DEFAULT '已請款'
                     CHECK (status IN ('已請款','已收款')),
  invoiced_at      DATE,
  received_at      DATE,
  notes            TEXT,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (payment_stage_id)  -- one invoice per stage, no partial payments
);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_invoices" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- CLEANUP (run only after verifying new code works correctly)
-- ============================================================

-- Once payment_stages.project_id is fully populated and the app
-- no longer writes to payment_stages.quotation_id, drop the old column:
--
-- ALTER TABLE payment_stages DROP COLUMN quotation_id;
