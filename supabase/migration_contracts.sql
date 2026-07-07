-- 合約資料表
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS contracts (
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

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_contracts" ON contracts
  FOR ALL USING (auth.role() = 'authenticated');

-- Auto updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_contracts'
  ) THEN
    CREATE TRIGGER set_updated_at_contracts
      BEFORE UPDATE ON contracts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
