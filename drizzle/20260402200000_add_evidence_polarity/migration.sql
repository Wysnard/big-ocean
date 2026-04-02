-- Add evidence_polarity enum type and polarity column to conversation_evidence (Story 42-1)
-- Polarity (high/low) replaces raw deviation in the v3 extraction model.
-- Column is nullable for backward compat — existing rows have NULL polarity.

CREATE TYPE "evidence_polarity" AS ENUM ('high', 'low');

ALTER TABLE "conversation_evidence" ADD COLUMN "polarity" "evidence_polarity";
