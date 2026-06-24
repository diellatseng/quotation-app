-- projects.name → projects.marketing_name (nullable)
-- projects.land_section → NOT NULL + UNIQUE
-- quotations.project_name → quotations.marketing_name

-- ── projects ─────────────────────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketing_name TEXT;

UPDATE projects
SET marketing_name = NULLIF(TRIM(name), '')
WHERE marketing_name IS NULL
  AND name IS NOT NULL
  AND TRIM(name) <> ''
  AND TRIM(name) <> '未命名案件'
  AND name !~ '^Project-\d+$'
  AND (land_section IS NULL OR TRIM(name) <> TRIM(land_section));

UPDATE projects
SET land_section = TRIM(name)
WHERE (land_section IS NULL OR TRIM(land_section) = '')
  AND name IS NOT NULL
  AND TRIM(name) <> ''
  AND TRIM(name) <> '未命名案件'
  AND name !~ '^Project-\d+$';

UPDATE projects
SET land_section = 'LEGACY-' || id::text
WHERE land_section IS NULL OR TRIM(land_section) = '';

-- Resolve duplicate land_section before unique constraint
WITH ranked AS (
  SELECT id, land_section,
         ROW_NUMBER() OVER (PARTITION BY land_section ORDER BY created_at, id) AS rn
  FROM projects
)
UPDATE projects p
SET land_section = p.land_section || ' (' || LEFT(p.id::text, 8) || ')'
FROM ranked r
WHERE p.id = r.id AND r.rn > 1;

ALTER TABLE projects ALTER COLUMN land_section SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_land_section_key'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_land_section_key UNIQUE (land_section);
  END IF;
END $$;

ALTER TABLE projects DROP COLUMN IF EXISTS name;

-- ── quotations ───────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotations'
      AND column_name = 'project_name'
  ) THEN
    ALTER TABLE quotations RENAME COLUMN project_name TO marketing_name;
  END IF;
END $$;
