-- Initialize PostgreSQL Test Database for big-ocean integration testing
-- This script runs automatically when PostgreSQL container starts
-- Creates all tables needed for integration tests
--
-- IMPORTANT: Keep in sync with Drizzle schema at
--   packages/infrastructure/src/db/drizzle/schema.ts
-- and migration at
--   drizzle/20260222190000_story_9_1_clean_slate/migration.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- pgEnums (Story 9.1)
-- ============================================================================

CREATE TYPE "public"."evidence_domain" AS ENUM('work', 'relationships', 'family', 'leisure', 'solo', 'other');
CREATE TYPE "public"."bigfive_facet_name" AS ENUM('imagination', 'artistic_interests', 'emotionality', 'adventurousness', 'intellect', 'liberalism', 'self_efficacy', 'orderliness', 'dutifulness', 'achievement_striving', 'self_discipline', 'cautiousness', 'friendliness', 'gregariousness', 'assertiveness', 'activity_level', 'excitement_seeking', 'cheerfulness', 'trust', 'morality', 'altruism', 'cooperation', 'modesty', 'sympathy', 'anxiety', 'anger', 'depression', 'self_consciousness', 'immoderation', 'vulnerability');

-- ============================================================================
-- Better Auth Tables
-- ============================================================================

CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);

CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Assessment Tables (Story 9.1 — two-tier architecture)
-- ============================================================================

CREATE TABLE "assessment_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"session_token" text,
	"status" text DEFAULT 'active' NOT NULL,
	"finalization_progress" text,
	"message_count" integer DEFAULT 0 NOT NULL,
	"personal_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "assessment_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" text,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"target_domain" "evidence_domain",
	"target_bigfive_facet" "bigfive_facet_name",
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "assessment_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_session_id" uuid NOT NULL,
	"facets" jsonb NOT NULL,
	"traits" jsonb NOT NULL,
	"domain_coverage" jsonb NOT NULL,
	"portrait" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- ============================================================================
-- Evidence Tables (Story 9.1 — two-tier: conversation + finalization)
-- ============================================================================

CREATE TABLE "conversation_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_session_id" uuid NOT NULL,
	"assessment_message_id" uuid NOT NULL,
	"bigfive_facet" "bigfive_facet_name" NOT NULL,
	"score" smallint NOT NULL CHECK (score >= 0 AND score <= 20),
	"confidence" numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
	"domain" "evidence_domain" NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "finalization_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_message_id" uuid NOT NULL,
	"assessment_result_id" uuid NOT NULL,
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

-- ============================================================================
-- Public Profile Table
-- ============================================================================

CREATE TABLE "public_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"assessment_result_id" uuid,
	"user_id" text,
	"ocean_code_5" text NOT NULL,
	"ocean_code_4" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Waitlist Table (Story 15.3)
-- ============================================================================

CREATE TABLE "waitlist_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_emails_email_unique" UNIQUE("email")
);

-- ============================================================================
-- Purchase Events Table (Story 13.1)
-- ============================================================================

CREATE TYPE "public"."purchase_event_type" AS ENUM('free_credit_granted', 'portrait_unlocked', 'credit_purchased', 'credit_consumed', 'extended_conversation_unlocked', 'portrait_refunded', 'credit_refunded', 'extended_conversation_refunded');

CREATE TABLE "purchase_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_type" "purchase_event_type" NOT NULL,
	"polar_checkout_id" text,
	"polar_product_id" text,
	"amount_cents" integer,
	"currency" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Portraits Table (Story 13.3)
-- ============================================================================

CREATE TABLE "portraits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_result_id" uuid NOT NULL,
	"tier" text NOT NULL,
	"content" text,
	"locked_section_titles" jsonb,
	"model_used" text NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Profile Access Log Table (Story 15.1)
-- ============================================================================

CREATE TABLE "profile_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"accessor_user_id" text,
	"accessor_ip" text,
	"accessor_user_agent" text,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Better Auth indexes
CREATE INDEX "account_userId_idx" ON "account" ("user_id");
CREATE INDEX "session_userId_idx" ON "session" ("user_id");
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");

-- Assessment indexes
CREATE INDEX "assessment_session_user_id_idx" ON "assessment_session" ("user_id");
CREATE UNIQUE INDEX "assessment_session_user_id_unique" ON "assessment_session" ("user_id") WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX "assessment_session_token_unique" ON "assessment_session" ("session_token") WHERE session_token IS NOT NULL;
CREATE INDEX "assessment_message_session_created_idx" ON "assessment_message" ("session_id", "created_at");

-- Evidence indexes
CREATE INDEX "conversation_evidence_session_id_idx" ON "conversation_evidence" ("assessment_session_id");
CREATE INDEX "finalization_evidence_result_id_idx" ON "finalization_evidence" ("assessment_result_id");

-- Public profile indexes
CREATE INDEX "public_profile_session_id_idx" ON "public_profile" ("session_id");
CREATE INDEX "public_profile_user_id_idx" ON "public_profile" ("user_id");

-- Purchase events indexes (Story 13.1)
CREATE INDEX "purchase_events_user_id_idx" ON "purchase_events" ("user_id");
CREATE UNIQUE INDEX "purchase_events_polar_checkout_id_unique" ON "purchase_events" ("polar_checkout_id") WHERE polar_checkout_id IS NOT NULL;

-- Portraits indexes (Story 13.3)
CREATE INDEX "portraits_assessment_result_id_idx" ON "portraits" ("assessment_result_id");
CREATE UNIQUE INDEX "portraits_result_tier_unique" ON "portraits" ("assessment_result_id", "tier");

-- Profile access log indexes (Story 15.1)
CREATE INDEX "profile_access_log_profile_created_idx" ON "profile_access_log" ("profile_id", "created_at");

-- ============================================================================
-- Foreign Key Constraints
-- ============================================================================

-- Better Auth constraints
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- Assessment constraints
ALTER TABLE "assessment_session" ADD CONSTRAINT "assessment_session_user_id_user_id_fkey"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

ALTER TABLE "assessment_message" ADD CONSTRAINT "assessment_message_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("session_id") REFERENCES "assessment_session"("id") ON DELETE CASCADE;

ALTER TABLE "assessment_message" ADD CONSTRAINT "assessment_message_user_id_user_id_fkey"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

-- Assessment results constraints
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("assessment_session_id") REFERENCES "assessment_session"("id") ON DELETE CASCADE;

-- Evidence constraints
ALTER TABLE "conversation_evidence" ADD CONSTRAINT "conversation_evidence_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("assessment_session_id") REFERENCES "assessment_session"("id") ON DELETE CASCADE;

ALTER TABLE "conversation_evidence" ADD CONSTRAINT "conversation_evidence_message_id_assessment_message_id_fkey"
	FOREIGN KEY ("assessment_message_id") REFERENCES "assessment_message"("id") ON DELETE CASCADE;

ALTER TABLE "finalization_evidence" ADD CONSTRAINT "finalization_evidence_message_id_assessment_message_id_fkey"
	FOREIGN KEY ("assessment_message_id") REFERENCES "assessment_message"("id") ON DELETE CASCADE;

ALTER TABLE "finalization_evidence" ADD CONSTRAINT "finalization_evidence_result_id_assessment_results_id_fkey"
	FOREIGN KEY ("assessment_result_id") REFERENCES "assessment_results"("id") ON DELETE CASCADE;

-- Public profile constraints
ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("session_id") REFERENCES "assessment_session"("id") ON DELETE CASCADE;

ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_result_id_assessment_results_id_fkey"
	FOREIGN KEY ("assessment_result_id") REFERENCES "assessment_results"("id") ON DELETE CASCADE;

ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_user_id_user_id_fkey"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

-- Purchase events constraints (Story 13.1)
ALTER TABLE "purchase_events" ADD CONSTRAINT "purchase_events_user_id_user_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT;

-- Portraits constraints (Story 13.3)
ALTER TABLE "portraits" ADD CONSTRAINT "portraits_assessment_result_id_assessment_results_id_fk"
	FOREIGN KEY ("assessment_result_id") REFERENCES "assessment_results"("id") ON DELETE CASCADE;

-- Profile access log constraints (Story 15.1)
ALTER TABLE "profile_access_log" ADD CONSTRAINT "profile_access_log_profile_id_public_profile_id_fk"
	FOREIGN KEY ("profile_id") REFERENCES "public_profile"("id") ON DELETE CASCADE;
