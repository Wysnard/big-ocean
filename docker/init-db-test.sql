-- Initialize PostgreSQL Test Database for big-ocean integration testing
-- This script runs automatically when PostgreSQL container starts
-- Creates all tables needed for integration tests
--
-- IMPORTANT: Keep in sync with Drizzle schema at
--   packages/infrastructure/src/db/drizzle/schema.ts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
-- Assessment Tables
-- ============================================================================

CREATE TABLE "assessment_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"personal_description" text
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
-- Evidence Table
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

-- ============================================================================
-- Public Profile Table
-- ============================================================================

CREATE TABLE "public_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"user_id" text,
	"ocean_code_5" text NOT NULL,
	"ocean_code_4" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
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

-- Evidence indexes
CREATE INDEX "facet_evidence_assessment_message_id_idx" ON "facet_evidence" ("assessment_message_id");
CREATE INDEX "facet_evidence_facet_name_idx" ON "facet_evidence" ("facet_name");

-- Public profile indexes
CREATE INDEX "public_profile_session_id_idx" ON "public_profile" ("session_id");
CREATE INDEX "public_profile_user_id_idx" ON "public_profile" ("user_id");

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

-- Evidence constraints
ALTER TABLE "facet_evidence" ADD CONSTRAINT "facet_evidence_assessment_message_id_assessment_message_id_fkey"
	FOREIGN KEY ("assessment_message_id") REFERENCES "assessment_message"("id") ON DELETE CASCADE;

-- Public profile constraints
ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_session_id_assessment_session_id_fkey"
	FOREIGN KEY ("session_id") REFERENCES "assessment_session"("id") ON DELETE CASCADE;

ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_user_id_user_id_fkey"
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;
