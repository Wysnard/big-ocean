-- Deduplicate public_profile rows per conversation before enforcing uniqueness.
-- Keep the earliest created row for each conversation_id.
WITH ranked AS (
	SELECT
		id,
		ROW_NUMBER() OVER (
			PARTITION BY conversation_id
			ORDER BY created_at ASC, id ASC
		) AS rn
	FROM public_profile
)
DELETE FROM public_profile pp
USING ranked r
WHERE pp.id = r.id
	AND r.rn > 1;

-- Ensure public profiles are uniquely tied to a single assessment session (conversation).
CREATE UNIQUE INDEX IF NOT EXISTS "public_profile_conversation_id_unique"
	ON "public_profile" ("conversation_id");

-- Ledger for at-most-once portrait queue offers (in-memory queue has no dedupe).
CREATE TABLE IF NOT EXISTS "portrait_job_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"job_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "portrait_job_offers_conversation_job_key_unique"
	ON "portrait_job_offers" ("conversation_id", "job_key");

CREATE INDEX IF NOT EXISTS "portrait_job_offers_conversation_id_idx"
	ON "portrait_job_offers" ("conversation_id");
