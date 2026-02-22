-- Story 9.1: Clean-slate migration for two-tier architecture
-- Drops all old assessment tables and checkpoint tables, recreates with new schema

-- Drop old tables (order matters for FK constraints)
DROP TABLE IF EXISTS "checkpoint_writes" CASCADE;
DROP TABLE IF EXISTS "checkpoint_blobs" CASCADE;
DROP TABLE IF EXISTS "checkpoint_migrations" CASCADE;
DROP TABLE IF EXISTS "public_profile" CASCADE;
DROP TABLE IF EXISTS "facet_evidence" CASCADE;
DROP TABLE IF EXISTS "assessment_message" CASCADE;
DROP TABLE IF EXISTS "assessment_session" CASCADE;
DROP TYPE IF EXISTS "public"."evidence_domain" CASCADE;
DROP TYPE IF EXISTS "public"."bigfive_facet_name" CASCADE;

-- Create pgEnums
CREATE TYPE "public"."evidence_domain" AS ENUM('work', 'relationships', 'family', 'leisure', 'solo', 'other');
CREATE TYPE "public"."bigfive_facet_name" AS ENUM('imagination', 'artistic_interests', 'emotionality', 'adventurousness', 'intellect', 'liberalism', 'self_efficacy', 'orderliness', 'dutifulness', 'achievement_striving', 'self_discipline', 'cautiousness', 'friendliness', 'gregariousness', 'assertiveness', 'activity_level', 'excitement_seeking', 'cheerfulness', 'trust', 'morality', 'altruism', 'cooperation', 'modesty', 'sympathy', 'anxiety', 'anger', 'depression', 'self_consciousness', 'immoderation', 'vulnerability');

-- Recreate assessment_session with new columns
CREATE TABLE "assessment_session" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "session_token" text,
  "status" text DEFAULT 'active' NOT NULL,
  "finalization_progress" text,
  "message_count" integer DEFAULT 0 NOT NULL,
  "personal_description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "assessment_session_user_id_idx" ON "assessment_session" USING btree ("user_id");
CREATE UNIQUE INDEX "assessment_session_user_id_unique" ON "assessment_session" ("user_id") WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX "assessment_session_token_unique" ON "assessment_session" ("session_token") WHERE session_token IS NOT NULL;

-- Recreate assessment_message with steering columns
CREATE TABLE "assessment_message" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "target_domain" "evidence_domain",
  "target_bigfive_facet" "bigfive_facet_name",
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "assessment_message_session_created_idx" ON "assessment_message" USING btree ("session_id", "created_at");

-- Create assessment_results (JSONB for facets/traits/domainCoverage, TEXT for portrait)
CREATE TABLE "assessment_results" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "assessment_session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "facets" jsonb NOT NULL,
  "traits" jsonb NOT NULL,
  "domain_coverage" jsonb NOT NULL,
  "portrait" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Create conversation_evidence (lean, steering-only)
CREATE TABLE "conversation_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "assessment_session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "assessment_message_id" uuid NOT NULL REFERENCES "assessment_message"("id") ON DELETE CASCADE,
  "bigfive_facet" "bigfive_facet_name" NOT NULL,
  "score" smallint NOT NULL CHECK (score >= 0 AND score <= 20),
  "confidence" numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  "domain" "evidence_domain" NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX "conversation_evidence_session_id_idx" ON "conversation_evidence" USING btree ("assessment_session_id");

-- Create finalization_evidence (rich, portrait-quality)
CREATE TABLE "finalization_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "assessment_message_id" uuid NOT NULL REFERENCES "assessment_message"("id") ON DELETE CASCADE,
  "assessment_result_id" uuid NOT NULL REFERENCES "assessment_results"("id") ON DELETE CASCADE,
  "bigfive_facet" "bigfive_facet_name" NOT NULL,
  "score" smallint NOT NULL CHECK (score >= 0 AND score <= 20),
  "confidence" numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  "domain" "evidence_domain" NOT NULL,
  "raw_domain" text NOT NULL,
  "quote" text NOT NULL,
  "highlight_start" integer,
  "highlight_end" integer,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX "finalization_evidence_result_id_idx" ON "finalization_evidence" USING btree ("assessment_result_id");

-- Recreate public_profile with dual FK (session + assessment_result)
CREATE TABLE "public_profile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "assessment_result_id" uuid REFERENCES "assessment_results"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "ocean_code_5" text NOT NULL,
  "ocean_code_4" text NOT NULL,
  "is_public" boolean DEFAULT false NOT NULL,
  "view_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "public_profile_session_id_idx" ON "public_profile" USING btree ("session_id");
CREATE INDEX "public_profile_user_id_idx" ON "public_profile" USING btree ("user_id");
