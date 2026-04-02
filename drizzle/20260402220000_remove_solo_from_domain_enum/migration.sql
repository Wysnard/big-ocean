-- Remove "solo" from the evidence_domain enum (Story C.1 — post-implementation cleanup)
-- PostgreSQL does not support ALTER TYPE ... REMOVE VALUE, so we:
--   1. Verify no rows reference "solo"
--   2. Create a new enum type without "solo"
--   3. Alter the column to use the new type (via text cast)
--   4. Drop the old type
--   5. Rename the new type to the original name

-- Safety check: abort if any rows still reference "solo"
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM conversation_evidence WHERE domain = 'solo') THEN
    RAISE EXCEPTION 'Cannot remove solo from enum: rows still reference it. Run the solo migration first.';
  END IF;
END $$;

-- Step 1: Create new enum type without solo
CREATE TYPE evidence_domain_v2 AS ENUM ('work', 'relationships', 'family', 'leisure', 'health', 'other');

-- Step 2: Alter column to use new type (cast through text)
ALTER TABLE conversation_evidence
  ALTER COLUMN domain TYPE evidence_domain_v2
  USING domain::text::evidence_domain_v2;

-- Step 3: Drop old enum type
DROP TYPE evidence_domain;

-- Step 4: Rename new type to original name
ALTER TYPE evidence_domain_v2 RENAME TO evidence_domain;
