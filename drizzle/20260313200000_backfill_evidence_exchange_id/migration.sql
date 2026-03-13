-- Backfill exchange_id on conversation_evidence rows.
-- Evidence shares the same exchange as the user message it was extracted from
-- (both linked via assessment_message_id → assessment_message.exchange_id).

UPDATE conversation_evidence ce
SET exchange_id = am.exchange_id
FROM assessment_message am
WHERE ce.assessment_message_id = am.id
  AND ce.exchange_id IS NULL
  AND am.exchange_id IS NOT NULL;
