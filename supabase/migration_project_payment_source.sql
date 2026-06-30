-- Track whether project payment stages were imported from a quotation or created manually.
-- Safe to re-run

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS source_quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL;
