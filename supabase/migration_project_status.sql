-- Project status: 草稿 → 未報價
-- Safe to re-run. Drops ALL check constraints on projects.status (any name).

-- 1. Drop every CHECK on projects.status (handles auto-generated constraint names)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped
    WHERE n.nspname = 'public'
      AND t.relname = 'projects'
      AND c.contype = 'c'
      AND a.attname = 'status'
  LOOP
    EXECUTE format('ALTER TABLE public.projects DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- 2. Migrate existing rows (safe once constraints are dropped)
UPDATE public.projects SET status = '未報價' WHERE status = '草稿';

-- 3. Add canonical constraint (skip if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.projects'::regclass
      AND conname = 'projects_status_check'
  ) THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
      CHECK (status IN ('未報價', '已報價', '已確認報價', '進行中', '完工', '暫停', '已刪除'));
  END IF;
END $$;

-- 4. Default for new rows
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT '未報價';

-- 5. Verify — should show ONE row containing 未報價
SELECT conname AS constraint_name, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.projects'::regclass
  AND contype = 'c';
