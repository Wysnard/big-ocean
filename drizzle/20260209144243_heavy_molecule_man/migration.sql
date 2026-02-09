CREATE TABLE "public_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"user_id" text,
	"ocean_code_5" text NOT NULL,
	"ocean_code_4" text NOT NULL,
	"archetype_name" text NOT NULL,
	"description" text NOT NULL,
	"color" text NOT NULL,
	"trait_summary" jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "public_profile_session_id_idx" ON "public_profile" ("session_id");--> statement-breakpoint
CREATE INDEX "public_profile_user_id_idx" ON "public_profile" ("user_id");--> statement-breakpoint
ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_session_id_assessment_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assessment_session"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;