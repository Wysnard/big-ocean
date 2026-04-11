-- Cleanup: remove the diagnostic test user created while debugging the
-- production signup flow on 2026-04-10. The user was created to verify
-- that migrations, Polar, and Better Auth were wired up correctly and is
-- no longer needed.
--
-- Most FKs to "user"."id" use ON DELETE CASCADE (session, account,
-- conversations, relationship_qr_tokens, etc.) so the final DELETE FROM
-- "user" takes care of them automatically. purchase_events.user_id uses
-- ON DELETE SET NULL, so we clear those rows explicitly first to avoid
-- leaving orphaned NULL rows in the append-only audit log.

DELETE FROM purchase_events
WHERE user_id IN (
	SELECT id FROM "user" WHERE email = 'diagnostic-1775863858@gmail.com'
);

DELETE FROM verification
WHERE identifier = 'diagnostic-1775863858@gmail.com';

DELETE FROM "user"
WHERE email = 'diagnostic-1775863858@gmail.com';
