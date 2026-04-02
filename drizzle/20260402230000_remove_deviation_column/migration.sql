-- Remove deviation column from conversation_evidence (Derive-at-Read principle)
-- deviation = deriveDeviation(polarity, strength) — pure deterministic function
-- ADR-27: polarity + strength are the source of truth, deviation is derived at read time
ALTER TABLE conversation_evidence DROP COLUMN deviation;
