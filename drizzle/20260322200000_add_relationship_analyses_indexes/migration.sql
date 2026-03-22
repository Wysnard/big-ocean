-- Add indexes on relationship_analyses user columns for query performance
CREATE INDEX IF NOT EXISTS "relationship_analyses_user_a_id_idx" ON "relationship_analyses" ("user_a_id");
CREATE INDEX IF NOT EXISTS "relationship_analyses_user_b_id_idx" ON "relationship_analyses" ("user_b_id");
