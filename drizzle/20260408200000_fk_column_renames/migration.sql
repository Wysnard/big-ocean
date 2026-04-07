-- Story 45-4: FK Column Migration (ADR-39)
-- Rename downstream FK columns to conversation-consistent naming:
--   assessment_session_id -> conversation_id (in conversation_evidence, assessment_results, portrait_ratings)
--   assessment_message_id -> message_id (in conversation_evidence)
--   session_id -> conversation_id (in exchanges, messages, public_profile)
-- Rename associated indexes to match new column names.

-- ─── Column renames ────────────────────────────────────────────────────────

ALTER TABLE "conversation_evidence" RENAME COLUMN "assessment_session_id" TO "conversation_id";
--> statement-breakpoint

ALTER TABLE "conversation_evidence" RENAME COLUMN "assessment_message_id" TO "message_id";
--> statement-breakpoint

ALTER TABLE "assessment_results" RENAME COLUMN "assessment_session_id" TO "conversation_id";
--> statement-breakpoint

ALTER TABLE "portrait_ratings" RENAME COLUMN "assessment_session_id" TO "conversation_id";
--> statement-breakpoint

ALTER TABLE "exchanges" RENAME COLUMN "session_id" TO "conversation_id";
--> statement-breakpoint

ALTER TABLE "messages" RENAME COLUMN "session_id" TO "conversation_id";
--> statement-breakpoint

ALTER TABLE "public_profile" RENAME COLUMN "session_id" TO "conversation_id";
--> statement-breakpoint

-- ─── Index renames ─────────────────────────────────────────────────────────

ALTER INDEX "assessment_results_session_id_unique" RENAME TO "assessment_results_conversation_id_unique";
--> statement-breakpoint

ALTER INDEX "assessment_exchange_session_id_idx" RENAME TO "exchange_conversation_id_idx";
--> statement-breakpoint

ALTER INDEX "assessment_exchange_session_turn_unique" RENAME TO "exchange_conversation_turn_unique";
--> statement-breakpoint

ALTER INDEX "assessment_message_session_created_idx" RENAME TO "message_conversation_created_idx";
--> statement-breakpoint

ALTER INDEX "conversation_evidence_session_id_idx" RENAME TO "conversation_evidence_conversation_id_idx";
--> statement-breakpoint

ALTER INDEX "portrait_ratings_session_id_idx" RENAME TO "portrait_ratings_conversation_id_idx";
--> statement-breakpoint

ALTER INDEX "public_profile_session_id_idx" RENAME TO "public_profile_conversation_id_idx";
