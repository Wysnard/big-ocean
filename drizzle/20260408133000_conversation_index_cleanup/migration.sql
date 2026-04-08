ALTER INDEX "assessment_session_user_id_idx" RENAME TO "conversation_user_id_idx";
ALTER INDEX "assessment_session_original_lifetime_unique" RENAME TO "conversation_original_lifetime_unique";
ALTER INDEX "assessment_session_token_unique" RENAME TO "conversation_token_unique";
ALTER INDEX "assessment_session_parent_session_id_idx" RENAME TO "conversation_parent_id_idx";
