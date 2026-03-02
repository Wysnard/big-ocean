-- Schema sync migration
-- 1. Add intent_type column to assessment_message
-- 2. Drop + recreate conversation_evidence with v2 schema (deviation/strength/confidence enums)
-- 3. Add portrait_ratings table + enums (Story 19-2)

-- Add intent_type to assessment_message
ALTER TABLE "assessment_message" ADD COLUMN IF NOT EXISTS "intent_type" text;

-- Create new enum types for evidence v2
DO $$ BEGIN
  CREATE TYPE "evidence_strength" AS ENUM ('weak', 'moderate', 'strong');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "evidence_confidence" AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Drop v1 conversation_evidence and recreate with v2 schema
DROP TABLE IF EXISTS "conversation_evidence" CASCADE;

CREATE TABLE "conversation_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "assessment_session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "assessment_message_id" uuid NOT NULL REFERENCES "assessment_message"("id") ON DELETE CASCADE,
  "bigfive_facet" "bigfive_facet_name" NOT NULL,
  "deviation" smallint NOT NULL,
  "strength" "evidence_strength" NOT NULL,
  "confidence" "evidence_confidence" NOT NULL,
  "domain" "evidence_domain" NOT NULL,
  "note" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "conversation_evidence_deviation_check" CHECK (deviation >= -3 AND deviation <= 3)
);

CREATE INDEX "conversation_evidence_session_id_idx" ON "conversation_evidence" USING btree ("assessment_session_id");

-- Portrait rating enums (Story 19-2)
DO $$ BEGIN
  CREATE TYPE "portrait_type" AS ENUM ('teaser', 'full');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "portrait_rating" AS ENUM ('up', 'down');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "depth_signal" AS ENUM ('rich', 'moderate', 'thin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portrait ratings table (Story 19-2)
CREATE TABLE IF NOT EXISTS "portrait_ratings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "assessment_session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "portrait_type" "portrait_type" NOT NULL,
  "rating" "portrait_rating" NOT NULL,
  "depth_signal" "depth_signal" NOT NULL,
  "evidence_count" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "portrait_ratings_session_id_idx" ON "portrait_ratings" ("assessment_session_id");
