-- Story 36-1: Add parent_session_id for conversation extension sessions
-- Enables linking extension sessions to their parent completed session.

-- 1. Add parent_session_id column (nullable UUID)
ALTER TABLE "assessment_session"
  ADD COLUMN "parent_session_id" uuid;

-- 2. Add index on parent_session_id for efficient lookups
CREATE INDEX "assessment_session_parent_session_id_idx"
  ON "assessment_session" ("parent_session_id");

-- 3. Drop the old unique constraint that only allows one completed session per user
DROP INDEX IF EXISTS "assessment_session_user_lifetime_unique";

-- 4. Add new partial unique constraint: one original (non-extension) completed session per user
CREATE UNIQUE INDEX "assessment_session_original_lifetime_unique"
  ON "assessment_session" ("user_id")
  WHERE user_id IS NOT NULL AND parent_session_id IS NULL AND status IN ('finalizing', 'completed');
