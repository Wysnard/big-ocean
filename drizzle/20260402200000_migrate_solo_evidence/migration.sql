-- Migrate existing solo evidence to health or leisure (Story 40-3)
-- Deterministic rule: health-related facets go to "health", all others to "leisure"
-- Solo stays in pgEnum for backward compat — removal deferred to Story C.1

-- Step 1: Remap health-related facets from solo to health
UPDATE conversation_evidence
SET domain = 'health'
WHERE domain = 'solo'
  AND bigfive_facet IN (
    'activity_level',
    'self_discipline',
    'excitement_seeking',
    'immoderation',
    'cautiousness',
    'vulnerability',
    'anxiety',
    'self_efficacy'
  );

-- Step 2: Remap all remaining solo evidence to leisure
UPDATE conversation_evidence
SET domain = 'leisure'
WHERE domain = 'solo';

-- Verification (run manually): SELECT COUNT(*) FROM conversation_evidence WHERE domain = 'solo';
-- Expected result: 0
