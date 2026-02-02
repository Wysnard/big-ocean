-- Add default values for score and confidence columns
-- This allows initializing all facets/traits with 0 (no data) at session start

-- facet_scores: default score and confidence to 0
ALTER TABLE "facet_scores" ALTER COLUMN "score" SET DEFAULT 0;
ALTER TABLE "facet_scores" ALTER COLUMN "confidence" SET DEFAULT 0;

-- trait_scores: default score and confidence to 0
ALTER TABLE "trait_scores" ALTER COLUMN "score" SET DEFAULT 0;
ALTER TABLE "trait_scores" ALTER COLUMN "confidence" SET DEFAULT 0;
