CREATE TABLE "user_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"assessment_result_id" uuid NOT NULL,
	"themes" jsonb NOT NULL,
	"quote_bank" jsonb NOT NULL,
	"summary_text" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "user_summaries"
	ADD CONSTRAINT "user_summaries_user_id_user_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
	ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "user_summaries"
	ADD CONSTRAINT "user_summaries_assessment_result_id_assessment_results_id_fk"
	FOREIGN KEY ("assessment_result_id") REFERENCES "public"."assessment_results"("id")
	ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "user_summaries"
	ADD CONSTRAINT "user_summaries_assessment_result_id_unique"
	UNIQUE("assessment_result_id");
--> statement-breakpoint

CREATE INDEX "user_summaries_user_id_updated_at_desc_idx"
	ON "user_summaries" USING btree ("user_id", "updated_at" DESC);
