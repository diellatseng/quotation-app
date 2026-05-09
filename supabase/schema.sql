-- ============================================================
-- 報價系統 Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- CLIENTS
CREATE TABLE clients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name            TEXT NOT NULL,
  address                 TEXT,
  phone                   TEXT,
  fax                     TEXT,
  email                   TEXT,
  responsible_person_name TEXT,
  responsible_person_title TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- CONTACT PERSONS (1-to-many → clients)
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

-- PROJECT TEMPLATES
CREATE TABLE project_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- SERVICES
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TEMPLATE <-> SERVICES (many-to-many, unique per template)
CREATE TABLE template_services (
  template_id UUID REFERENCES project_templates(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES services(id) ON DELETE CASCADE,
  sort_order  INT DEFAULT 0,
  PRIMARY KEY (template_id, service_id)
);

-- SERVICE CHECKLIST ITEMS (1-to-many → services)
CREATE TABLE service_checklist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID REFERENCES services(id) ON DELETE CASCADE,
  item_text   TEXT NOT NULL,
  sort_order  INT DEFAULT 0
);

-- QUOTATIONS
CREATE TABLE quotations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number         TEXT NOT NULL,
  version              INT DEFAULT 1,
  parent_id            UUID REFERENCES quotations(id) ON DELETE SET NULL,
  status               TEXT NOT NULL DEFAULT '草稿'
                         CHECK (status IN ('草稿','已報價','已確認','已封存')),
  is_negotiating       BOOLEAN DEFAULT FALSE,
  client_id            UUID REFERENCES clients(id) ON DELETE SET NULL,
  contact_person_id    UUID REFERENCES contact_persons(id) ON DELETE SET NULL,
  contact_person_snapshot JSONB,
  project_template_id  UUID REFERENCES project_templates(id) ON DELETE SET NULL,
  -- 工程資料
  building_permit      TEXT,
  land_section         TEXT,
  project_scale        TEXT,
  project_owner        TEXT,
  project_address      TEXT,
  -- 報價
  fee_amount           NUMERIC(14,2) DEFAULT 0,
  tax_included         BOOLEAN DEFAULT FALSE,
  quote_date           DATE DEFAULT CURRENT_DATE,
  notes                TEXT,
  created_by           UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- QUOTATION SERVICES (line items)
CREATE TABLE quotation_services (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id        UUID REFERENCES quotations(id) ON DELETE CASCADE,
  service_id          UUID,
  service_name        TEXT NOT NULL,
  category            TEXT,
  checklist_items     JSONB DEFAULT '[]',
  sort_order          INT DEFAULT 0,
  is_added            BOOLEAN DEFAULT FALSE
);

-- PAYMENT STAGES
CREATE TABLE payment_stages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id  UUID REFERENCES quotations(id) ON DELETE CASCADE,
  stage_name    TEXT NOT NULL,
  percentage    NUMERIC(5,2) DEFAULT 0,
  amount        NUMERIC(14,2) DEFAULT 0,
  sort_order    INT DEFAULT 0
);

-- NEGOTIATION LOG
CREATE TABLE negotiation_log (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id             UUID REFERENCES quotations(id) ON DELETE CASCADE,
  logged_at                TIMESTAMPTZ DEFAULT NOW(),
  old_amount               NUMERIC(14,2),
  new_amount               NUMERIC(14,2),
  contact_person_snapshot  JSONB,
  notes                    TEXT,
  logged_by                UUID REFERENCES auth.users(id)
);

-- ── AUTO updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_project_templates_updated_at
  BEFORE UPDATE ON project_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_quotations_updated_at
  BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE clients                ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_persons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_stages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_log        ENABLE ROW LEVEL SECURITY;

-- All authenticated users can do everything (internal app)
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clients','contact_persons','project_templates','services',
    'template_services','service_checklist_items','quotations',
    'quotation_services','payment_stages','negotiation_log'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "auth_all_%s" ON %I FOR ALL USING (auth.role() = ''authenticated'')',
      tbl, tbl
    );
  END LOOP;
END $$;
