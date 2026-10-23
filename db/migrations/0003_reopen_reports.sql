BEGIN;

-- Extend the guard so a finalized report can be reopened.
-- We null out finalized_at / finalized_by so the UI treats it as a
-- normal draft again, but we keep report_no so the number is not
-- re-assigned (it stays unique and stable on the printed form).
CREATE OR REPLACE FUNCTION guard_report() RETURNS trigger
LANGUAGE plpgsql AS $f$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' THEN
      RAISE EXCEPTION 'Only draft reports can be deleted (use void)';
    END IF;
    RETURN OLD;
  END IF;

  -- finalized -> void (existing behaviour)
  IF OLD.status = 'finalized' AND NEW.status = 'void' THEN
    RETURN NEW;
  END IF;

  -- finalized -> draft  (reopen for editing)
  IF OLD.status = 'finalized' AND NEW.status = 'draft' THEN
    NEW.finalized_at := NULL;
    NEW.finalized_by := NULL;
    RETURN NEW;
  END IF;

  IF OLD.status <> 'draft' AND NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'finalized' AND NEW.status = 'void') THEN
    RAISE EXCEPTION 'Invalid status change % -> %', OLD.status, NEW.status;
  END IF;

  IF OLD.status <> 'draft' AND
     (to_jsonb(NEW) - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at') THEN
    RAISE EXCEPTION 'Report % is % and cannot be edited', OLD.id, OLD.status;
  END IF;

  RETURN NEW;
END $f$;

COMMIT;