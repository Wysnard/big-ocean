-- Unified initial schema (consolidated from 29 incremental migrations)
-- Represents the full database state as of 2026-03-23.

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE "public"."evidence_domain" AS ENUM('work', 'relationships', 'family', 'leisure', 'solo', 'other');

CREATE TYPE "public"."bigfive_facet_name" AS ENUM(
  'imagination', 'artistic_interests', 'emotionality', 'adventurousness', 'intellect', 'liberalism',
  'self_efficacy', 'orderliness', 'dutifulness', 'achievement_striving', 'self_discipline', 'cautiousness',
  'friendliness', 'gregariousness', 'assertiveness', 'activity_level', 'excitement_seeking', 'cheerfulness',
  'trust', 'morality', 'altruism', 'cooperation', 'modesty', 'sympathy',
  'anxiety', 'anger', 'depression', 'self_consciousness', 'immoderation', 'vulnerability'
);

CREATE TYPE "public"."evidence_strength" AS ENUM('weak', 'moderate', 'strong');
CREATE TYPE "public"."evidence_confidence" AS ENUM('low', 'medium', 'high');
CREATE TYPE "public"."result_stage" AS ENUM('scored', 'completed');
CREATE TYPE "public"."portrait_type" AS ENUM('full');
CREATE TYPE "public"."portrait_rating" AS ENUM('up', 'down');
CREATE TYPE "public"."depth_signal" AS ENUM('rich', 'moderate', 'thin');
CREATE TYPE "public"."purchase_event_type" AS ENUM(
  'free_credit_granted', 'portrait_unlocked', 'credit_purchased', 'credit_consumed',
  'extended_conversation_unlocked', 'portrait_refunded', 'credit_refunded', 'extended_conversation_refunded'
);
CREATE TYPE "public"."qr_token_status" AS ENUM('active', 'accepted', 'expired');

-- ─── Better Auth tables ─────────────────────────────────────────────────────

CREATE TABLE "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX "session_userId_idx" ON "session" ("user_id");

CREATE TABLE "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "account_userId_idx" ON "account" ("user_id");

CREATE TABLE "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");

-- ─── Assessment tables ──────────────────────────────────────────────────────

CREATE TABLE "assessment_session" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text REFERENCES "user"("id") ON DELETE CASCADE,
  "session_token" text,
  "status" text NOT NULL DEFAULT 'active',
  "finalization_progress" text,
  "message_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "drop_off_email_sent_at" timestamp,
  "check_in_email_sent_at" timestamp,
  "recapture_email_sent_at" timestamp,
  "parent_session_id" uuid
);
CREATE INDEX "assessment_session_user_id_idx" ON "assessment_session" ("user_id");
CREATE UNIQUE INDEX "assessment_session_original_lifetime_unique" ON "assessment_session" ("user_id")
  WHERE user_id IS NOT NULL AND parent_session_id IS NULL AND status IN ('finalizing', 'completed');
CREATE UNIQUE INDEX "assessment_session_token_unique" ON "assessment_session" ("session_token")
  WHERE session_token IS NOT NULL;
CREATE INDEX "assessment_session_parent_session_id_idx" ON "assessment_session" ("parent_session_id");

CREATE TABLE "assessment_exchange" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "turn_number" smallint NOT NULL,
  -- Extraction
  "energy" real,
  "energy_band" text,
  "telling" real,
  "telling_band" text,
  "within_message_shift" boolean,
  "state_notes" jsonb,
  "extraction_tier" smallint,
  -- Pacing
  "smoothed_energy" real,
  "comfort" real,
  "drain" real,
  "drain_ceiling" real,
  "e_target" real,
  -- Scoring
  "scorer_output" jsonb,
  -- Selection
  "selected_territory" text,
  "selection_rule" text,
  -- Governor
  "governor_output" jsonb,
  "governor_debug" jsonb,
  -- Derived
  "session_phase" text,
  "transition_type" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "assessment_exchange_session_id_idx" ON "assessment_exchange" ("session_id");
CREATE UNIQUE INDEX "assessment_exchange_session_turn_unique" ON "assessment_exchange" ("session_id", "turn_number");

CREATE TABLE "assessment_message" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "exchange_id" uuid REFERENCES "assessment_exchange"("id") ON DELETE SET NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "assessment_message_session_created_idx" ON "assessment_message" ("session_id", "created_at");

CREATE TABLE "conversation_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessment_session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "assessment_message_id" uuid NOT NULL REFERENCES "assessment_message"("id") ON DELETE CASCADE,
  "exchange_id" uuid REFERENCES "assessment_exchange"("id") ON DELETE SET NULL,
  "bigfive_facet" "bigfive_facet_name" NOT NULL,
  "deviation" smallint NOT NULL,
  "strength" "evidence_strength" NOT NULL,
  "confidence" "evidence_confidence" NOT NULL,
  "domain" "evidence_domain" NOT NULL,
  "note" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "conversation_evidence_deviation_check" CHECK (deviation >= -3 AND deviation <= 3)
);
CREATE INDEX "conversation_evidence_session_id_idx" ON "conversation_evidence" ("assessment_session_id");

CREATE TABLE "assessment_results" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessment_session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "facets" jsonb NOT NULL,
  "traits" jsonb NOT NULL,
  "domain_coverage" jsonb NOT NULL,
  "portrait" text NOT NULL,
  "stage" "result_stage",
  "created_at" timestamp DEFAULT now()
);
CREATE UNIQUE INDEX "assessment_results_session_id_unique" ON "assessment_results" ("assessment_session_id");

-- ─── Profile & Sharing ──────────────────────────────────────────────────────

CREATE TABLE "public_profile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "assessment_result_id" uuid REFERENCES "assessment_results"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "user"("id") ON DELETE CASCADE,
  "ocean_code_5" text NOT NULL,
  "ocean_code_4" text NOT NULL,
  "is_public" boolean NOT NULL DEFAULT false,
  "view_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "public_profile_session_id_idx" ON "public_profile" ("session_id");
CREATE INDEX "public_profile_user_id_idx" ON "public_profile" ("user_id");

CREATE TABLE "profile_access_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid NOT NULL REFERENCES "public_profile"("id") ON DELETE CASCADE,
  "accessor_user_id" text,
  "accessor_ip" text,
  "accessor_user_agent" text,
  "action" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "profile_access_log_profile_created_idx" ON "profile_access_log" ("profile_id", "created_at");

-- ─── Monetization ───────────────────────────────────────────────────────────

CREATE TABLE "purchase_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "event_type" "purchase_event_type" NOT NULL,
  "polar_checkout_id" text,
  "polar_product_id" text,
  "amount_cents" integer,
  "currency" text,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "purchase_events_user_id_idx" ON "purchase_events" ("user_id");
CREATE UNIQUE INDEX "purchase_events_polar_checkout_id_unique" ON "purchase_events" ("polar_checkout_id")
  WHERE polar_checkout_id IS NOT NULL;

-- ─── Waitlist ───────────────────────────────────────────────────────────────

CREATE TABLE "waitlist_emails" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- ─── Portraits ──────────────────────────────────────────────────────────────

CREATE TABLE "portraits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessment_result_id" uuid NOT NULL REFERENCES "assessment_results"("id") ON DELETE CASCADE,
  "tier" text NOT NULL,
  "content" text,
  "model_used" text NOT NULL,
  "retry_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "portraits_result_tier_unique" ON "portraits" ("assessment_result_id", "tier");
CREATE INDEX "portraits_assessment_result_id_idx" ON "portraits" ("assessment_result_id");

-- ─── Portrait Ratings ───────────────────────────────────────────────────────

CREATE TABLE "portrait_ratings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "assessment_session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "portrait_type" "portrait_type" NOT NULL,
  "rating" "portrait_rating" NOT NULL,
  "depth_signal" "depth_signal" NOT NULL,
  "evidence_count" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "portrait_ratings_session_id_idx" ON "portrait_ratings" ("assessment_session_id");

-- ─── Relationship QR Tokens ─────────────────────────────────────────────────

CREATE TABLE "relationship_qr_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "status" "qr_token_status" NOT NULL DEFAULT 'active',
  "accepted_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "relationship_qr_tokens_user_idx" ON "relationship_qr_tokens" ("user_id");

-- ─── Relationship Analyses ──────────────────────────────────────────────────

CREATE TABLE "relationship_analyses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_a_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "user_b_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "user_a_result_id" uuid NOT NULL REFERENCES "assessment_results"("id") ON DELETE CASCADE,
  "user_b_result_id" uuid NOT NULL REFERENCES "assessment_results"("id") ON DELETE CASCADE,
  "content" text,
  "model_used" text,
  "retry_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "relationship_analyses_user_a_id_idx" ON "relationship_analyses" ("user_a_id");
CREATE INDEX "relationship_analyses_user_b_id_idx" ON "relationship_analyses" ("user_b_id");
