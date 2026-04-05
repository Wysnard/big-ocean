-- Remove legacy signalPower keys from persisted assessment_results JSONB payloads.
-- Facets and traits now persist only score + confidence.

UPDATE assessment_results
SET
  facets = COALESCE(
    (
      SELECT jsonb_object_agg(
        facet_key,
        CASE
          WHEN jsonb_typeof(facet_value) = 'object' THEN facet_value - 'signalPower'
          ELSE facet_value
        END
      )
      FROM jsonb_each(assessment_results.facets) AS facet_entries(facet_key, facet_value)
    ),
    '{}'::jsonb
  ),
  traits = COALESCE(
    (
      SELECT jsonb_object_agg(
        trait_key,
        CASE
          WHEN jsonb_typeof(trait_value) = 'object' THEN trait_value - 'signalPower'
          ELSE trait_value
        END
      )
      FROM jsonb_each(assessment_results.traits) AS trait_entries(trait_key, trait_value)
    ),
    '{}'::jsonb
  )
WHERE
  EXISTS (
    SELECT 1
    FROM jsonb_each(assessment_results.facets) AS facet_entries(facet_key, facet_value)
    WHERE jsonb_typeof(facet_value) = 'object' AND facet_value ? 'signalPower'
  )
  OR EXISTS (
    SELECT 1
    FROM jsonb_each(assessment_results.traits) AS trait_entries(trait_key, trait_value)
    WHERE jsonb_typeof(trait_value) = 'object' AND trait_value ? 'signalPower'
  );
