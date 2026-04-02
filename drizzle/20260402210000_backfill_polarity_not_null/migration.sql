-- Backfill polarity from deviation for pre-v3 evidence, then make NOT NULL
-- deviation > 0 → 'high', deviation < 0 → 'low', deviation = 0 → 'high' (neutral default)

UPDATE conversation_evidence
SET polarity = CASE
  WHEN deviation >= 0 THEN 'high'::evidence_polarity
  ELSE 'low'::evidence_polarity
END
WHERE polarity IS NULL;

ALTER TABLE "conversation_evidence" ALTER COLUMN "polarity" SET NOT NULL;
