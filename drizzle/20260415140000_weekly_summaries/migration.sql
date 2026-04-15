CREATE TABLE "weekly_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"content" text,
	"generated_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"retry_count" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "weekly_summaries"
	ADD CONSTRAINT "weekly_summaries_user_id_user_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
	ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "weekly_summaries"
	ADD CONSTRAINT "weekly_summaries_user_week_start_unique"
	UNIQUE("user_id", "week_start_date");
--> statement-breakpoint

CREATE INDEX "weekly_summaries_user_week_start_desc_idx"
	ON "weekly_summaries" USING btree ("user_id", "week_start_date" DESC);
