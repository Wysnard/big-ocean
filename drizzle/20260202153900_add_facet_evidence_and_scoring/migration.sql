-- Story 2.3: Evidence-Based Analyzer and Scorer Implementation
-- Add facet_evidence, facet_scores, and trait_scores tables
-- Using uuid for all IDs (consistent with base schema)

-- Facet Evidence Table (Analyzer Output)
CREATE TABLE "facet_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"message_id" uuid NOT NULL,
	"facet_name" text NOT NULL,
	"score" integer NOT NULL,
	"confidence" integer NOT NULL,
	"quote" text NOT NULL,
	"highlight_start" integer NOT NULL,
	"highlight_end" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Facet Scores Table (Aggregated from Evidence)
CREATE TABLE "facet_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"facet_name" text NOT NULL,
	"score" integer NOT NULL,
	"confidence" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Trait Scores Table (Derived from Facet Scores)
CREATE TABLE "trait_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"trait_name" text NOT NULL,
	"score" integer NOT NULL,
	"confidence" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Indexes for facet_evidence
CREATE INDEX "facet_evidence_message_id_idx" ON "facet_evidence" ("message_id");
--> statement-breakpoint
CREATE INDEX "facet_evidence_facet_name_idx" ON "facet_evidence" ("facet_name");
--> statement-breakpoint

-- Indexes for facet_scores
CREATE INDEX "facet_scores_session_id_idx" ON "facet_scores" ("session_id");
--> statement-breakpoint
CREATE INDEX "facet_scores_facet_name_idx" ON "facet_scores" ("facet_name");
--> statement-breakpoint
CREATE INDEX "facet_scores_session_facet_unique_idx" ON "facet_scores" ("session_id", "facet_name");
--> statement-breakpoint

-- Indexes for trait_scores
CREATE INDEX "trait_scores_session_id_idx" ON "trait_scores" ("session_id");
--> statement-breakpoint
CREATE INDEX "trait_scores_trait_name_idx" ON "trait_scores" ("trait_name");
--> statement-breakpoint
CREATE INDEX "trait_scores_session_trait_unique_idx" ON "trait_scores" ("session_id", "trait_name");
--> statement-breakpoint

-- Foreign Key Constraints (referencing actual table names from DB)
ALTER TABLE "facet_evidence" ADD CONSTRAINT "facet_evidence_message_id_messages_id_fkey"
	FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE "facet_scores" ADD CONSTRAINT "facet_scores_session_id_sessions_id_fkey"
	FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE "trait_scores" ADD CONSTRAINT "trait_scores_session_id_sessions_id_fkey"
	FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE;
