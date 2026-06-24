-- Project status: 草稿 → 未報價
-- Safe to re-run

UPDATE projects SET status = '未報價' WHERE status = '草稿';

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('未報價', '已報價', '已確認報價', '進行中', '完工', '暫停', '已刪除'));
ALTER TABLE projects ALTER COLUMN status SET DEFAULT '未報價';
