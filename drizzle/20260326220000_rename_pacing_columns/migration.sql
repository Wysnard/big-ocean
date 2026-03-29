-- Rename pacing columns to reflect trust-based e-target pipeline (v3)
-- comfort → session_trust (accumulated trust level, gates depth)
-- drain_ceiling → trust_cap (ceiling from trust, replaces old fatigue ceiling)
ALTER TABLE "assessment_exchange" RENAME COLUMN "comfort" TO "session_trust";
ALTER TABLE "assessment_exchange" RENAME COLUMN "drain_ceiling" TO "trust_cap";
