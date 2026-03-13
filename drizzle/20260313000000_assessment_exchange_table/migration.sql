-- Story 27-3: Create assessment_exchange table and add exchange_id FK columns
-- assessment_exchange stores per-turn pipeline state (extraction, pacing, scoring, selection, governor)

CREATE TABLE "assessment_exchange" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid NOT NULL REFERENCES "assessment_session"("id") ON DELETE CASCADE,
  "turn_number" smallint NOT NULL,
  "energy" real,
  "energy_band" text,
  "telling" real,
  "telling_band" text,
  "within_message_shift" boolean,
  "state_notes" jsonb,
  "extraction_tier" smallint,
  "smoothed_energy" real,
  "comfort" real,
  "drain" real,
  "drain_ceiling" real,
  "e_target" real,
  "scorer_output" jsonb,
  "selected_territory" text,
  "selection_rule" text,
  "governor_output" jsonb,
  "governor_debug" jsonb,
  "session_phase" text,
  "transition_type" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "assessment_exchange_session_id_idx" ON "assessment_exchange" USING btree ("session_id");
CREATE UNIQUE INDEX "assessment_exchange_session_turn_unique" ON "assessment_exchange" ("session_id", "turn_number");

--> statement-breakpoint

-- Add exchange_id FK to assessment_message
ALTER TABLE "assessment_message" ADD COLUMN "exchange_id" uuid REFERENCES "assessment_exchange"("id") ON DELETE SET NULL;

--> statement-breakpoint

-- Add exchange_id FK to conversation_evidence
ALTER TABLE "conversation_evidence" ADD COLUMN "exchange_id" uuid REFERENCES "assessment_exchange"("id") ON DELETE SET NULL;
