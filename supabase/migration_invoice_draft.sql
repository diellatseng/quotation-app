-- Invoice draft workflow: 草稿 → 已請款 → 已收款
-- Safe to re-run

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('草稿', '已請款', '已收款'));
ALTER TABLE invoices ALTER COLUMN status SET DEFAULT '草稿';
