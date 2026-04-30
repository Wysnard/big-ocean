-- ADR-55: versioned user_summary_versions; migrate from user_summaries
CREATE TABLE "user_summary_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"assessment_result_id" uuid,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"refresh_source" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"token_count" integer
);
--> statement-breakpoint

ALTER TABLE "user_summary_versions"
	ADD CONSTRAINT "user_summary_versions_user_id_user_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
	ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "user_summary_versions"
	ADD CONSTRAINT "user_summary_versions_assessment_result_id_assessment_results_id_fk"
	FOREIGN KEY ("assessment_result_id") REFERENCES "public"."assessment_results"("id")
	ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX "user_summary_versions_user_version_unique"
	ON "user_summary_versions" USING btree ("user_id", "version");
--> statement-breakpoint

CREATE UNIQUE INDEX "user_summary_versions_assessment_result_unique"
	ON "user_summary_versions" USING btree ("assessment_result_id")
	WHERE "assessment_result_id" IS NOT NULL;
--> statement-breakpoint

CREATE INDEX "user_summary_versions_user_id_version_desc_idx"
	ON "user_summary_versions" USING btree ("user_id", "version" DESC);
--> statement-breakpoint

INSERT INTO "user_summary_versions" (
	"id",
	"user_id",
	"assessment_result_id",
	"version",
	"content",
	"refresh_source",
	"generated_at"
)
SELECT
	gen_random_uuid(),
	us."user_id",
	us."assessment_result_id",
	(ROW_NUMBER() OVER (PARTITION BY us."user_id" ORDER BY us."created_at" ASC))::integer,
	jsonb_build_object(
		'themes',
		us."themes",
		'quoteBank',
		us."quote_bank",
		'summaryText',
		us."summary_text"
	),
	'assessment_completion',
	us."created_at"
FROM "user_summaries" AS us;
--> statement-breakpoint

DROP TABLE "user_summaries";
