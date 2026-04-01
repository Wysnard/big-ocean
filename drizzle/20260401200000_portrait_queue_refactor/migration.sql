-- Portrait queue refactor: fire-once-from-webhook architecture
-- Replaces placeholder row + retryCount with queue-based generation.
-- Portrait rows are now only inserted on final outcome (success or failure).

-- Step 1: Add failedAt column
ALTER TABLE "portraits" ADD COLUMN "failed_at" timestamp;

-- Step 2: Migrate existing failed portraits (retryCount >= 3, no content)
UPDATE "portraits" SET "failed_at" = "created_at" WHERE "retry_count" >= 3 AND "content" IS NULL;

-- Step 3: Remove in-progress placeholders (no content, not failed)
-- These will be re-triggered by reconciliation on next status poll.
DELETE FROM "portraits" WHERE "content" IS NULL AND "retry_count" < 3;

-- Step 4: Drop retryCount column (no longer needed — Effect.retry handles retries in-memory)
ALTER TABLE "portraits" DROP COLUMN "retry_count";

-- Step 5: Make modelUsed nullable (failure rows may not have a model response)
ALTER TABLE "portraits" ALTER COLUMN "model_used" DROP NOT NULL;
