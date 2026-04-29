DELETE FROM "conversations" WHERE "user_id" IS NULL;

DROP INDEX IF EXISTS "conversation_token_unique";

ALTER TABLE "conversations" DROP COLUMN IF EXISTS "session_token";

ALTER TABLE "conversations" ALTER COLUMN "user_id" SET NOT NULL;
