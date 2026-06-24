-- Project work status: 報價相關狀態移出，只保留工程進度
-- 未報價/已報價/已確認報價/進行中 → 未開工/已開工；暫停、完工、已刪除 保留語意
-- Safe to re-run

-- 1. Drop every CHECK on projects.status
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

-- 2. Migrate existing rows
UPDATE public.projects SET status = '未開工'
WHERE status IN ('未報價', '已報價', '已確認報價', '草稿');

UPDATE public.projects SET status = '已開工'
WHERE status = '進行中';

-- 暫停、完工、已刪除 維持不變

-- 3. Add canonical constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.projects'::regclass
      AND conname = 'projects_status_check'
  ) THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
      CHECK (status IN ('未開工', '已開工', '暫停', '完工', '已刪除'));
  END IF;
END $$;

-- 4. Default for new projects
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT '未開工';

-- 5. Verify
SELECT conname AS constraint_name, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.projects'::regclass
  AND contype = 'c';

SELECT status, COUNT(*) AS count
FROM public.projects
GROUP BY status
ORDER BY status;
