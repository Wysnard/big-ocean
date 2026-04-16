-- Initialize PostgreSQL Test Database for big-ocean integration testing
-- This script runs automatically when PostgreSQL container starts
-- Creates all tables needed for integration tests
--
-- IMPORTANT: Keep in sync with Drizzle schema at
--   packages/infrastructure/src/db/drizzle/schema.ts
-- and migration at
--   drizzle/ (latest conversation-era migrations)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- pgEnums (Story 9.1)
-- ============================================================================

CREATE TYPE "public"."evidence_domain" AS ENUM('work', 'relationships', 'family', 'leisure', 'health', 'other');
CREATE TYPE "public"."bigfive_facet_name" AS ENUM('imagination', 'artistic_interests', 'emotionality', 'adventurousness', 'intellect', 'liberalism', 'self_efficacy', 'orderliness', 'dutifulness', 'achievement_striving', 'self_discipline', 'cautiousness', 'friendliness', 'gregariousness', 'assertiveness', 'activity_level', 'excitement_seeking', 'cheerfulness', 'trust', 'morality', 'altruism', 'cooperation', 'modesty', 'sympathy', 'anxiety', 'anger', 'depression', 'self_consciousness', 'immoderation', 'vulnerability');
CREATE TYPE "public"."evidence_polarity" AS ENUM('high', 'low');
CREATE TYPE "public"."result_stage" AS ENUM('scored', 'completed');

-- ============================================================================
-- Better Auth Tables
-- ============================================================================

CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"subscription_nudge_email_sent_at" timestamp,
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

CREATE TYPE "public"."conversation_type" AS ENUM('assessment', 'extension', 'coach', 'journal', 'career');

CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"session_token" text,
	"status" text DEFAULT 'active' NOT NULL,
	"finalization_progress" text,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"drop_off_email_sent_at" timestamp,
	"check_in_email_sent_at" timestamp,
	"parent_conversation_id" uuid,
	"conversation_type" "conversation_type" NOT NULL DEFAULT 'assessment',
	"metadata" jsonb
);

CREATE TABLE "exchanges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"turn_number" smallint NOT NULL,
	"extraction_tier" smallint,
	"director_output" text,
	"coverage_targets" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"exchange_id" uuid,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "assessment_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"facets" jsonb NOT NULL,
	"traits" jsonb NOT NULL,
	"domain_coverage" jsonb NOT NULL,
	"portrait" text NOT NULL,
	"stage" "result_stage",
	"created_at" timestamp DEFAULT now()
);

-- ============================================================================
-- Evidence Tables (Story 18-1 — v2: deviation/strength/confidence enums)
-- ============================================================================

CREATE TYPE "public"."evidence_strength" AS ENUM ('weak', 'moderate', 'strong');
CREATE TYPE "public"."evidence_confidence" AS ENUM ('low', 'medium', 'high');

CREATE TABLE "conversation_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"exchange_id" uuid,
	"bigfive_facet" "bigfive_facet_name" NOT NULL,
	"deviation" smallint NOT NULL CHECK (deviation >= -3 AND deviation <= 3),
	"strength" "evidence_strength" NOT NULL,
	"confidence" "evidence_confidence" NOT NULL,
	"domain" "evidence_domain" NOT NULL,
	"polarity" "evidence_polarity" NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- ============================================================================
-- Public Profile Table
-- ============================================================================

CREATE TABLE "public_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
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

CREATE TYPE "public"."purchase_event_type" AS ENUM('free_credit_granted', 'portrait_unlocked', 'credit_purchased', 'credit_consumed', 'extended_conversation_unlocked', 'portrait_refunded', 'credit_refunded', 'extended_conversation_refunded', 'subscription_started', 'subscription_renewed', 'subscription_cancelled', 'subscription_expired');

CREATE TABLE "purchase_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"event_type" "purchase_event_type" NOT NULL,
	"polar_checkout_id" text,
	"polar_subscription_id" text,
	"polar_product_id" text,
	"amount_cents" integer,
	"currency" text,
	"metadata" jsonb,
	"assessment_result_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_events_subscription_id_required_check" CHECK (("event_type" NOT IN ('subscription_started', 'subscription_renewed', 'subscription_cancelled', 'subscription_expired')) OR "polar_subscription_id" IS NOT NULL)
);

-- ============================================================================
-- Portraits Table (Story 13.3)
-- ============================================================================

CREATE TABLE "portraits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_result_id" uuid NOT NULL,
	"tier" text NOT NULL,
	"content" text,
	"model_used" text,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Portrait Rating Enums & Table (Story 19-2)
-- ============================================================================

CREATE TYPE "public"."portrait_type" AS ENUM('teaser', 'full');
CREATE TYPE "public"."portrait_rating" AS ENUM('up', 'down');
CREATE TYPE "public"."depth_signal" AS ENUM('rich', 'moderate', 'thin');

CREATE TABLE "portrait_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"conversation_id" uuid NOT NULL,
	"portrait_type" "portrait_type" NOT NULL,
	"rating" "portrait_rating" NOT NULL,
	"depth_signal" "depth_signal" NOT NULL,
	"evidence_count" integer NOT NULL,
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
CREATE INDEX "conversation_user_id_idx" ON "conversations" ("user_id");
CREATE UNIQUE INDEX "conversation_original_lifetime_unique" ON "conversations" ("user_id")
	WHERE user_id IS NOT NULL AND parent_conversation_id IS NULL AND status IN ('finalizing', 'completed');
CREATE UNIQUE INDEX "conversation_token_unique" ON "conversations" ("session_token") WHERE session_token IS NOT NULL;
CREATE INDEX "conversation_parent_id_idx" ON "conversations" ("parent_conversation_id");
CREATE INDEX "exchange_conversation_id_idx" ON "exchanges" ("conversation_id");
CREATE UNIQUE INDEX "exchange_conversation_turn_unique" ON "exchanges" ("conversation_id", "turn_number");
CREATE INDEX "message_conversation_created_idx" ON "messages" ("conversation_id", "created_at");
CREATE UNIQUE INDEX "assessment_results_conversation_id_unique" ON "assessment_results" ("conversation_id");

-- Evidence indexes
CREATE INDEX "conversation_evidence_conversation_id_idx" ON "conversation_evidence" ("conversation_id");

-- Public profile indexes
CREATE INDEX "public_profile_conversation_id_idx" ON "public_profile" ("conversation_id");
CREATE INDEX "public_profile_user_id_idx" ON "public_profile" ("user_id");

-- Purchase events indexes (Story 13.1)
CREATE INDEX "purchase_events_user_id_idx" ON "purchase_events" ("user_id");
CREATE INDEX "purchase_events_assessment_result_id_idx" ON "purchase_events" ("assessment_result_id");
CREATE INDEX "purchase_events_polar_subscription_id_idx" ON "purchase_events" ("polar_subscription_id");
CREATE UNIQUE INDEX "purchase_events_polar_checkout_id_unique" ON "purchase_events" ("polar_checkout_id") WHERE polar_checkout_id IS NOT NULL;
CREATE UNIQUE INDEX "purchase_events_sub_started_unique" ON "purchase_events" ("polar_subscription_id") WHERE "event_type" = 'subscription_started' AND "polar_subscription_id" IS NOT NULL;
CREATE UNIQUE INDEX "purchase_events_sub_cancelled_unique" ON "purchase_events" ("polar_subscription_id") WHERE "event_type" = 'subscription_cancelled' AND "polar_subscription_id" IS NOT NULL;
CREATE UNIQUE INDEX "purchase_events_sub_expired_unique" ON "purchase_events" ("polar_subscription_id") WHERE "event_type" = 'subscription_expired' AND "polar_subscription_id" IS NOT NULL;
CREATE UNIQUE INDEX "purchase_events_sub_renewed_period_unique" ON "purchase_events" ("polar_subscription_id",("metadata"->>'renewalPeriodEnd')) WHERE "event_type" = 'subscription_renewed' AND "polar_subscription_id" IS NOT NULL AND ("metadata"->>'renewalPeriodEnd') IS NOT NULL;

-- Portraits indexes (Story 13.3)
CREATE INDEX "portraits_assessment_result_id_idx" ON "portraits" ("assessment_result_id");
CREATE UNIQUE INDEX "portraits_result_tier_unique" ON "portraits" ("assessment_result_id", "tier");

-- Portrait ratings indexes (Story 19-2)
CREATE INDEX "portrait_ratings_conversation_id_idx" ON "portrait_ratings" ("conversation_id");

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
ALTER TABLE "conversations" ADD CONSTRAINT "assessment_session_user_id_user_id_fkey"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

ALTER TABLE "exchanges" ADD CONSTRAINT "exchange_conversation_id_conversations_id_fkey"
	FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "assessment_message_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_exchange_id_exchanges_id_fkey"
	FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE SET NULL;

-- Assessment results constraints
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;

-- Evidence constraints
ALTER TABLE "conversation_evidence" ADD CONSTRAINT "conversation_evidence_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;

ALTER TABLE "conversation_evidence" ADD CONSTRAINT "conversation_evidence_message_id_assessment_message_id_fkey"
	FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;

ALTER TABLE "conversation_evidence" ADD CONSTRAINT "conversation_evidence_exchange_id_exchanges_id_fkey"
	FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE SET NULL;

-- Public profile constraints
ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;

ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_result_id_assessment_results_id_fkey"
	FOREIGN KEY ("assessment_result_id") REFERENCES "assessment_results"("id") ON DELETE CASCADE;

ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_user_id_user_id_fkey"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

-- Purchase events constraints (Story 13.1)
ALTER TABLE "purchase_events" ADD CONSTRAINT "purchase_events_user_id_user_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

ALTER TABLE "purchase_events" ADD CONSTRAINT "purchase_events_assessment_result_id_assessment_results_id_fk"
	FOREIGN KEY ("assessment_result_id") REFERENCES "assessment_results"("id") ON DELETE SET NULL;

-- Portraits constraints (Story 13.3)
ALTER TABLE "portraits" ADD CONSTRAINT "portraits_assessment_result_id_assessment_results_id_fk"
	FOREIGN KEY ("assessment_result_id") REFERENCES "assessment_results"("id") ON DELETE CASCADE;

-- Profile access log constraints (Story 15.1)
ALTER TABLE "profile_access_log" ADD CONSTRAINT "profile_access_log_profile_id_public_profile_id_fk"
	FOREIGN KEY ("profile_id") REFERENCES "public_profile"("id") ON DELETE CASCADE;

-- ============================================================================
-- Invitation Status Enum (Story 14.2)
-- ============================================================================

CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'refused', 'expired');

-- ============================================================================
-- Relationship Invitations Table (Story 14.2)
-- ============================================================================

CREATE TABLE "relationship_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inviter_user_id" text NOT NULL,
	"invitee_user_id" text,
	"invitation_token" uuid NOT NULL,
	"personal_message" text,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_invitations_invitation_token_unique" UNIQUE("invitation_token")
);

-- ============================================================================
-- Relationship Analyses Table (Story 14.2 placeholder)
-- ============================================================================

CREATE TABLE "relationship_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"content" text,
	"model_used" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_analyses_invitation_id_unique" UNIQUE("invitation_id")
);

-- Relationship indexes (Story 14.2)
CREATE INDEX "relationship_invitations_inviter_idx" ON "relationship_invitations" ("inviter_user_id");

-- Relationship foreign keys (Story 14.2)
ALTER TABLE "relationship_invitations" ADD CONSTRAINT "relationship_invitations_inviter_user_id_user_id_fk"
	FOREIGN KEY ("inviter_user_id") REFERENCES "user"("id");

ALTER TABLE "relationship_invitations" ADD CONSTRAINT "relationship_invitations_invitee_user_id_user_id_fk"
	FOREIGN KEY ("invitee_user_id") REFERENCES "user"("id");

ALTER TABLE "relationship_analyses" ADD CONSTRAINT "relationship_analyses_invitation_id_relationship_invitations_id_fk"
	FOREIGN KEY ("invitation_id") REFERENCES "relationship_invitations"("id");

ALTER TABLE "relationship_analyses" ADD CONSTRAINT "relationship_analyses_user_a_id_user_id_fk"
	FOREIGN KEY ("user_a_id") REFERENCES "user"("id");

ALTER TABLE "relationship_analyses" ADD CONSTRAINT "relationship_analyses_user_b_id_user_id_fk"
	FOREIGN KEY ("user_b_id") REFERENCES "user"("id");

-- Portrait ratings constraints (Story 19-2)
ALTER TABLE "portrait_ratings" ADD CONSTRAINT "portrait_ratings_user_id_user_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "portrait_ratings" ADD CONSTRAINT "portrait_ratings_assessment_session_id_assessment_session_id_fk"
	FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
