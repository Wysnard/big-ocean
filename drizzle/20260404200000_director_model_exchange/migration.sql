-- Story 43-1: Exchange Table Migration & Schema Changes (Director Model)
-- Drop ~18 pacing/scoring/governor columns from assessment_exchange
-- Add director_output (text) and coverage_targets (jsonb) for Director model

-- Drop extraction state columns (energy/telling now read natively by Director)
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS energy;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS energy_band;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS telling;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS telling_band;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS within_message_shift;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS state_notes;

-- Drop pacing columns
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS smoothed_energy;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS session_trust;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS drain;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS trust_cap;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS e_target;

-- Drop scoring column
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS scorer_output;

-- Drop selection columns
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS selected_territory;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS selection_rule;

-- Drop governor columns
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS governor_output;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS governor_debug;

-- Drop derived columns
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS session_phase;
ALTER TABLE assessment_exchange DROP COLUMN IF EXISTS transition_type;

-- Add Director model columns
ALTER TABLE assessment_exchange ADD COLUMN director_output TEXT;
ALTER TABLE assessment_exchange ADD COLUMN coverage_targets JSONB;
