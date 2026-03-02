CREATE TYPE "public"."result_stage" AS ENUM('scored', 'completed');--> statement-breakpoint
ALTER TABLE "assessment_results" ADD COLUMN "stage" "result_stage";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "assessment_results_session_id_unique" ON "assessment_results" USING btree ("assessment_session_id");
