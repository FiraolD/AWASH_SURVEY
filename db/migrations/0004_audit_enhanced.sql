BEGIN;

-- ---------------------------------------------------------------------
-- 1. Extend audit_log
-- ---------------------------------------------------------------------
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS actor_email  text,
  ADD COLUMN IF NOT EXISTS diff         jsonb,
  ADD COLUMN IF NOT EXISTS row_pk       jsonb,
  ADD COLUMN IF NOT EXISTS request_id   text;

CREATE INDEX IF NOT EXISTS audit_log_actor_idx       ON audit_log (actor_id, at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_time_idx ON audit_log (entity, at DESC);
CREATE INDEX IF NOT EXISTS audit_log_row_pk_idx      ON audit_log USING gin (row_pk);
CREATE INDEX IF NOT EXISTS audit_log_diff_idx        ON audit_log USING gin (diff);

-- ---------------------------------------------------------------------
-- 2. Rewrite audit_row() — actor, redaction, no-op skip, diff
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_row() RETURNS trigger
LANGUAGE plpgsql AS $f$
DECLARE
  rec_old      jsonb;
  rec_new      jsonb;
  diff         jsonb;
  actor        uuid;
  actor_email  text;
  ignore_keys  text[] := ARRAY['updated_at'];
BEGIN
  actor       := NULLIF(current_setting('app.user_id', true), '')::uuid;
  actor_email := NULLIF(current_setting('app.user_email', true), '');

  -- DELETE
  IF TG_OP = 'DELETE' THEN
    rec_old := to_jsonb(OLD) - ignore_keys;
    IF TG_TABLE_NAME = 'users' THEN
      rec_old := rec_old - 'password_hash';
    END IF;

    INSERT INTO audit_log (actor_id, actor_email, entity, entity_id, action, changes, row_pk)
    VALUES (
      actor, actor_email, TG_TABLE_NAME, rec_old->>'id', 'DELETE', rec_old,
      jsonb_build_object('id', rec_old->>'id')
    );
    RETURN OLD;
  END IF;

  -- INSERT
  IF TG_OP = 'INSERT' THEN
    rec_new := to_jsonb(NEW) - ignore_keys;
    IF TG_TABLE_NAME = 'users' THEN
      rec_new := rec_new - 'password_hash';
    END IF;

    INSERT INTO audit_log (actor_id, actor_email, entity, entity_id, action, changes, row_pk)
    VALUES (
      actor, actor_email, TG_TABLE_NAME, rec_new->>'id', 'INSERT', rec_new,
      jsonb_build_object('id', rec_new->>'id')
    );
    RETURN NEW;
  END IF;

  -- UPDATE
  rec_old := to_jsonb(OLD) - ignore_keys;
  rec_new := to_jsonb(NEW) - ignore_keys;

  IF TG_TABLE_NAME = 'users' THEN
    rec_old := rec_old - 'password_hash';
    rec_new := rec_new - 'password_hash';
  END IF;

  -- search_text on parts is maintained by the part_translations trigger
  -- and is not a real user edit — skip it so the audit is clean.
  IF TG_TABLE_NAME = 'parts' THEN
    rec_old := rec_old - 'search_text';
    rec_new := rec_new - 'search_text';
  END IF;

  -- Skip no-op updates (idempotent saves, trigger-only writes)
  IF rec_old = rec_new THEN
    RETURN NEW;
  END IF;

  SELECT jsonb_object_agg(
           key,
           jsonb_build_object('from', rec_old->key, 'to', rec_new->key)
         )
  INTO diff
  FROM jsonb_object_keys(rec_new) AS key
  WHERE rec_new->key IS DISTINCT FROM rec_old->key;

  INSERT INTO audit_log (actor_id, actor_email, entity, entity_id, action, changes, diff, row_pk)
  VALUES (
    actor, actor_email, TG_TABLE_NAME, rec_new->>'id', 'UPDATE',
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
    diff,
    jsonb_build_object('id', rec_new->>'id')
  );
  RETURN NEW;
END $f$;

-- ---------------------------------------------------------------------
-- 3. Cover every mutable table
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS parts_audit        ON parts;
DROP TRIGGER IF EXISTS translations_audit ON part_translations;
DROP TRIGGER IF EXISTS reports_audit      ON survey_reports;
DROP TRIGGER IF EXISTS items_audit        ON report_items;
DROP TRIGGER IF EXISTS users_audit        ON users;
DROP TRIGGER IF EXISTS branches_audit     ON branches;

CREATE TRIGGER parts_audit
  AFTER INSERT OR UPDATE OR DELETE ON parts
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER translations_audit
  AFTER INSERT OR UPDATE OR DELETE ON part_translations
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER reports_audit
  AFTER INSERT OR UPDATE OR DELETE ON survey_reports
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER items_audit
  AFTER INSERT OR UPDATE OR DELETE ON report_items
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER users_audit
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER branches_audit
  AFTER INSERT OR UPDATE OR DELETE ON branches
  FOR EACH ROW EXECUTE FUNCTION audit_row();

COMMIT;