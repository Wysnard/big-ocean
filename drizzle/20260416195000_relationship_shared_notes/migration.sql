CREATE TABLE "relationship_shared_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_analysis_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "relationship_shared_notes"
	ADD CONSTRAINT "relationship_shared_notes_relationship_analysis_id_fk"
	FOREIGN KEY ("relationship_analysis_id") REFERENCES "public"."relationship_analyses"("id")
	ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "relationship_shared_notes"
	ADD CONSTRAINT "relationship_shared_notes_author_user_id_fk"
	FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id")
	ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "relationship_shared_notes_analysis_created_idx"
	ON "relationship_shared_notes" USING btree ("relationship_analysis_id", "created_at");
