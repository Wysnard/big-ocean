DO $$ BEGIN
	CREATE TYPE "public"."daily_check_in_mood" AS ENUM('great', 'good', 'okay', 'uneasy', 'rough');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	CREATE TYPE "public"."daily_check_in_visibility" AS ENUM('private', 'inner_circle', 'public_pulse');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE "daily_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"local_date" date NOT NULL,
	"mood" "public"."daily_check_in_mood" NOT NULL,
	"note" text,
	"visibility" "public"."daily_check_in_visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "daily_check_ins"
	ADD CONSTRAINT "daily_check_ins_user_id_user_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
	ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "daily_check_ins"
	ADD CONSTRAINT "daily_check_ins_user_local_date_unique"
	UNIQUE("user_id", "local_date");
--> statement-breakpoint

CREATE INDEX "daily_check_ins_user_created_idx"
	ON "daily_check_ins" USING btree ("user_id", "created_at" DESC);
