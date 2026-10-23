BEGIN;

-- New enums
CREATE TYPE item_condition AS ENUM ('new', 'used');
CREATE TYPE item_origin    AS ENUM ('genuine', 'local');

-- Add columns (nullable for now so backfill can run)
ALTER TABLE report_items
  ADD COLUMN condition item_condition,
  ADD COLUMN origin    item_origin;

-- Backfill existing replace items — they predate this feature.
-- 'new' is the safer default; admins can correct individual rows later.
UPDATE report_items
SET condition = 'new'
WHERE action = 'replace' AND condition IS NULL;

-- Now enforce: replace items always have a condition; repair items never do
ALTER TABLE report_items
  ADD CONSTRAINT items_condition_chk
    CHECK (
      (action = 'replace' AND condition IS NOT NULL)
      OR (action = 'repair'  AND condition IS NULL)
    );

-- Origin is only meaningful for replace items
ALTER TABLE report_items
  ADD CONSTRAINT items_origin_chk
    CHECK (origin IS NULL OR action = 'replace');

COMMIT;