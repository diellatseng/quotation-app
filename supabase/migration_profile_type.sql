-- 開立抬頭：支援公司與個人
-- Safe to re-run.

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS profile_type TEXT NOT NULL DEFAULT 'company';

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS honorific TEXT;

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS national_id TEXT;

UPDATE company_profiles
SET profile_type = 'company'
WHERE profile_type IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_profiles_profile_type_check'
  ) THEN
    ALTER TABLE company_profiles
      ADD CONSTRAINT company_profiles_profile_type_check
      CHECK (profile_type IN ('company', 'individual'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_profiles_honorific_check'
  ) THEN
    ALTER TABLE company_profiles
      ADD CONSTRAINT company_profiles_honorific_check
      CHECK (honorific IS NULL OR honorific IN ('先生', '小姐'));
  END IF;
END $$;
