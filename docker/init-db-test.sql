-- Initialize PostgreSQL Test Database for big-ocean integration testing
-- This script runs automatically when PostgreSQL container starts
-- Creates all tables needed for integration tests

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Better Auth Tables (from migration 20260131230139)
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
-- Assessment Tables (using correct Drizzle schema names)
-- ============================================================================

CREATE TABLE "assessment_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"confidence" jsonb NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "assessment_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"user_id" text,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Scoring Tables (from migration 20260202153900, 20260202183500)
-- ============================================================================

CREATE TABLE "facet_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"assessment_message_id" uuid NOT NULL,
	"facet_name" text NOT NULL,
	"score" integer NOT NULL,
	"confidence" integer NOT NULL,
	"quote" text NOT NULL,
	"highlight_start" integer NOT NULL,
	"highlight_end" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "facet_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"facet_name" text NOT NULL,
	"score" integer NOT NULL DEFAULT 0,
	"confidence" integer NOT NULL DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "trait_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"trait_name" text NOT NULL,
	"score" integer NOT NULL DEFAULT 0,
	"confidence" integer NOT NULL DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE INDEX "assessment_message_session_created_idx" ON "assessment_message" ("session_id","created_at");

-- Facet/Trait indexes
CREATE INDEX "facet_evidence_assessment_message_id_idx" ON "facet_evidence" ("assessment_message_id");
CREATE INDEX "facet_evidence_facet_name_idx" ON "facet_evidence" ("facet_name");
CREATE INDEX "facet_scores_session_id_idx" ON "facet_scores" ("session_id");
CREATE INDEX "facet_scores_facet_name_idx" ON "facet_scores" ("facet_name");
CREATE INDEX "facet_scores_session_facet_unique_idx" ON "facet_scores" ("session_id", "facet_name");
CREATE INDEX "trait_scores_session_id_idx" ON "trait_scores" ("session_id");
CREATE INDEX "trait_scores_trait_name_idx" ON "trait_scores" ("trait_name");
CREATE INDEX "trait_scores_session_trait_unique_idx" ON "trait_scores" ("session_id", "trait_name");

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

-- Scoring constraints
ALTER TABLE "facet_evidence" ADD CONSTRAINT "facet_evidence_assessment_message_id_assessment_message_id_fkey"
	FOREIGN KEY ("assessment_message_id") REFERENCES "assessment_message"("id") ON DELETE CASCADE;

ALTER TABLE "facet_scores" ADD CONSTRAINT "facet_scores_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("session_id") REFERENCES "assessment_session"("id") ON DELETE CASCADE;

ALTER TABLE "trait_scores" ADD CONSTRAINT "trait_scores_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("session_id") REFERENCES "assessment_session"("id") ON DELETE CASCADE;
