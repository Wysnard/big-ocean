ALTER TABLE "weekly_summaries" ADD COLUMN "llm_cost_cents" integer;
--> statement-breakpoint

CREATE INDEX "weekly_summaries_generated_at_llm_cost_idx"
	ON "weekly_summaries" ("generated_at" DESC)
	WHERE "llm_cost_cents" IS NOT NULL;
