-- DATABASE-LEVEL SAFETY NET
-- These protections live inside Postgres itself, so they hold no matter what
-- touches the data: the website, a script, Prisma Studio, or the Neon SQL
-- console. See AGENTS.md before changing or removing anything here.
--
-- 1. Every insert / update / delete on "Guest" is copied into "AuditLog" with
--    the full before/after row. A deleted guest or overwritten RSVP can always
--    be recovered from there.
-- 2. "AuditLog" is append-only: rows can never be updated or deleted.
-- 3. TRUNCATE is refused on both tables.
-- 4. A single statement may not delete more than 25 guests or update more
--    than 50 (the app never needs more — a household is deleted or RSVP'd one
--    row at a time). Bypass only deliberately, inside a transaction:
--      SET LOCAL app.allow_bulk = 'on';

-- 1. Change history ----------------------------------------------------------
CREATE OR REPLACE FUNCTION guest_audit() RETURNS trigger AS $$
DECLARE
  v_action text := COALESCE(NULLIF(current_setting('app.action', true), ''), 'db');
  v_actor  text := COALESCE(NULLIF(current_setting('app.actor',  true), ''), 'db');
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO "AuditLog" ("id","action","actor","guestId","guestName","before","after")
    VALUES (gen_random_uuid()::text, v_action || ':insert', v_actor, NEW."id", NEW."fullName", NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF to_jsonb(OLD) - 'updatedAt' IS DISTINCT FROM to_jsonb(NEW) - 'updatedAt' THEN
      INSERT INTO "AuditLog" ("id","action","actor","guestId","guestName","before","after")
      VALUES (gen_random_uuid()::text, v_action || ':update', v_actor, NEW."id", NEW."fullName", to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NEW;
  ELSE
    INSERT INTO "AuditLog" ("id","action","actor","guestId","guestName","before","after")
    VALUES (gen_random_uuid()::text, v_action || ':delete', v_actor, OLD."id", OLD."fullName", to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guest_audit_row
  AFTER INSERT OR UPDATE OR DELETE ON "Guest"
  FOR EACH ROW EXECUTE FUNCTION guest_audit();

-- 2. Append-only audit log ---------------------------------------------------
CREATE OR REPLACE FUNCTION auditlog_readonly() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditlog_no_change
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION auditlog_readonly();

-- 3. No truncation ------------------------------------------------------------
CREATE OR REPLACE FUNCTION refuse_truncate() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Refused: % on % would wipe the table', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guest_no_truncate
  BEFORE TRUNCATE ON "Guest"
  FOR EACH STATEMENT EXECUTE FUNCTION refuse_truncate();

CREATE TRIGGER auditlog_no_truncate
  BEFORE TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT EXECUTE FUNCTION refuse_truncate();

-- 4. Bulk-change limits -------------------------------------------------------
CREATE OR REPLACE FUNCTION guest_bulk_limit() RETURNS trigger AS $$
DECLARE
  n integer;
  lim integer := CASE WHEN TG_OP = 'DELETE' THEN 25 ELSE 50 END;
BEGIN
  IF current_setting('app.allow_bulk', true) = 'on' THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'DELETE' THEN
    SELECT count(*) INTO n FROM old_rows;
  ELSE
    SELECT count(*) INTO n FROM new_rows;
  END IF;
  IF n > lim THEN
    RAISE EXCEPTION 'Refused: one statement tried to % % guests (limit %). If this is really intended, run it in a transaction after SET LOCAL app.allow_bulk = ''on''.', lower(TG_OP), n, lim;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guest_bulk_delete_limit
  AFTER DELETE ON "Guest"
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT EXECUTE FUNCTION guest_bulk_limit();

CREATE TRIGGER guest_bulk_update_limit
  AFTER UPDATE ON "Guest"
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION guest_bulk_limit();
