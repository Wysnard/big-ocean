-- Story 15.1: Profile access audit log
CREATE TABLE IF NOT EXISTS "profile_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL REFERENCES "public_profile"("id") ON DELETE CASCADE,
	"accessor_user_id" text,
	"accessor_ip" text,
	"accessor_user_agent" text,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "profile_access_log_profile_created_idx"
	ON "profile_access_log" ("profile_id", "created_at");
