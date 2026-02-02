-- Rename message_id to assessment_message_id in facet_evidence table
-- This ensures consistent naming: assessment messages should be referenced as assessment_message_id

-- Step 1: Drop the old foreign key constraint
ALTER TABLE "facet_evidence" DROP CONSTRAINT IF EXISTS "facet_evidence_message_id_messages_id_fkey";
--> statement-breakpoint

-- Step 2: Drop the old index
DROP INDEX IF EXISTS "facet_evidence_message_id_idx";
--> statement-breakpoint

-- Step 3: Rename the column
ALTER TABLE "facet_evidence" RENAME COLUMN "message_id" TO "assessment_message_id";
--> statement-breakpoint

-- Step 4: Create new index with updated name
CREATE INDEX "facet_evidence_assessment_message_id_idx" ON "facet_evidence" ("assessment_message_id");
--> statement-breakpoint

-- Step 5: Add foreign key constraint with correct table reference
ALTER TABLE "facet_evidence" ADD CONSTRAINT "facet_evidence_assessment_message_id_assessment_message_id_fkey"
	FOREIGN KEY ("assessment_message_id") REFERENCES "assessment_message"("id") ON DELETE CASCADE;
