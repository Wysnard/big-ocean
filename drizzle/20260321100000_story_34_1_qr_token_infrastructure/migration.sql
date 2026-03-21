-- Story 34-1: QR Token Infrastructure (ADR-10)
-- Replaces invitation system with QR token model.

-- 1. Create QR token status enum
CREATE TYPE "qr_token_status" AS ENUM ('active', 'accepted', 'expired');

-- 2. Create relationship_qr_tokens table
CREATE TABLE "relationship_qr_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "status" "qr_token_status" NOT NULL DEFAULT 'active',
  "accepted_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "relationship_qr_tokens_user_idx" ON "relationship_qr_tokens" ("user_id");

-- 3. Update relationship_analyses: drop invitation_id, add result FKs
ALTER TABLE "relationship_analyses" DROP COLUMN IF EXISTS "invitation_id";
ALTER TABLE "relationship_analyses" ADD COLUMN "user_a_result_id" uuid REFERENCES "assessment_results"("id");
ALTER TABLE "relationship_analyses" ADD COLUMN "user_b_result_id" uuid REFERENCES "assessment_results"("id");
