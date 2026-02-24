-- Story 13.3: Full Portrait Async Generation
-- Two-tier portrait system (teaser/full) with placeholder row pattern

CREATE TABLE "portraits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_result_id" uuid NOT NULL,
	"tier" text NOT NULL,
	"content" text,
	"locked_section_titles" jsonb,
	"model_used" text NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "portraits_assessment_result_id_idx" ON "portraits" USING btree ("assessment_result_id");
CREATE UNIQUE INDEX "portraits_result_tier_unique" ON "portraits" USING btree ("assessment_result_id", "tier");

ALTER TABLE "portraits" ADD CONSTRAINT "portraits_assessment_result_id_assessment_results_id_fk" FOREIGN KEY ("assessment_result_id") REFERENCES "public"."assessment_results"("id") ON DELETE cascade ON UPDATE no action;
