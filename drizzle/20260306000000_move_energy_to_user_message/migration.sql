-- Move observed_energy_level from assistant messages to their preceding user messages.
-- Energy is a property of the user's words (extracted by ConversAnalyzer), not the assistant's response.

-- Step 1: Copy observed_energy_level from each assistant message to its preceding user message
WITH paired AS (
  SELECT
    id,
    role,
    observed_energy_level,
    LAG(id) OVER (PARTITION BY session_id ORDER BY created_at) AS prev_msg_id,
    LAG(role) OVER (PARTITION BY session_id ORDER BY created_at) AS prev_role
  FROM assessment_message
)
UPDATE assessment_message AS m
SET observed_energy_level = p.observed_energy_level
FROM paired p
WHERE m.id = p.prev_msg_id
  AND p.role = 'assistant'
  AND p.prev_role = 'user'
  AND p.observed_energy_level IS NOT NULL;

-- Step 2: Clear observed_energy_level from all assistant messages
UPDATE assessment_message
SET observed_energy_level = NULL
WHERE role = 'assistant' AND observed_energy_level IS NOT NULL;
