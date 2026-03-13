-- Drop stale columns from assessment_message that were moved to assessment_exchange in Story 23-3.
-- territory_id, observed_energy_level, user_id are no longer in the Drizzle schema;
-- territory/energy now live on assessment_exchange, userId is derivable from the session.

ALTER TABLE assessment_message DROP COLUMN IF EXISTS territory_id;
ALTER TABLE assessment_message DROP COLUMN IF EXISTS observed_energy_level;
ALTER TABLE assessment_message DROP COLUMN IF EXISTS user_id;
