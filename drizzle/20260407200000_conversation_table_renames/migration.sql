-- Story 45-1: Schema Migration — Table Renames (ADR-39)
-- Rename assessment tables to generic conversation names:
--   assessment_session  -> conversations
--   assessment_message  -> messages
--   assessment_exchange -> exchanges
-- Rename parent_session_id -> parent_conversation_id
-- Add conversation_type enum + column, metadata JSONB
-- Index and constraint names intentionally kept stable (Story 45-1 scope boundary).

-- ─── Table renames ──────────────────────────────────────────────────────────

ALTER TABLE "assessment_session" RENAME TO "conversations";
--> statement-breakpoint

ALTER TABLE "assessment_message" RENAME TO "messages";
--> statement-breakpoint

ALTER TABLE "assessment_exchange" RENAME TO "exchanges";
--> statement-breakpoint

-- ─── Column rename ──────────────────────────────────────────────────────────

ALTER TABLE "conversations" RENAME COLUMN "parent_session_id" TO "parent_conversation_id";
--> statement-breakpoint

-- ─── New enum and columns ───────────────────────────────────────────────────

CREATE TYPE "conversation_type" AS ENUM ('assessment', 'extension', 'coach', 'journal', 'career');
--> statement-breakpoint

ALTER TABLE "conversations" ADD COLUMN "conversation_type" "conversation_type" NOT NULL DEFAULT 'assessment';
--> statement-breakpoint

ALTER TABLE "conversations" ADD COLUMN "metadata" JSONB;
