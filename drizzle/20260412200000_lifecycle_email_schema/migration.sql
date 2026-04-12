-- Story 10-1: Lifecycle email schema changes
--
-- 1. Add user-scoped subscription nudge one-shot marker on "user" table
-- 2. Drop conversation-scoped recapture marker (replaced by subscription nudge)

ALTER TABLE "user" ADD COLUMN "subscription_nudge_email_sent_at" timestamp;

ALTER TABLE "conversations" DROP COLUMN IF EXISTS "recapture_email_sent_at";
