-- Story 14.2: Invitation System
-- Creates relationship_invitations and relationship_analyses tables

CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'refused', 'expired');

CREATE TABLE IF NOT EXISTS "relationship_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inviter_user_id" text NOT NULL,
	"invitee_user_id" text,
	"invitation_token" uuid NOT NULL,
	"personal_message" text,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_invitations_invitation_token_unique" UNIQUE("invitation_token")
);

CREATE TABLE IF NOT EXISTS "relationship_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"content" text,
	"model_used" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_analyses_invitation_id_unique" UNIQUE("invitation_id")
);

-- Indexes
CREATE INDEX "relationship_invitations_inviter_idx" ON "relationship_invitations" ("inviter_user_id");

-- Foreign keys
ALTER TABLE "relationship_invitations" ADD CONSTRAINT "relationship_invitations_inviter_user_id_user_id_fk"
	FOREIGN KEY ("inviter_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "relationship_invitations" ADD CONSTRAINT "relationship_invitations_invitee_user_id_user_id_fk"
	FOREIGN KEY ("invitee_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "relationship_analyses" ADD CONSTRAINT "relationship_analyses_invitation_id_relationship_invitations_id_fk"
	FOREIGN KEY ("invitation_id") REFERENCES "relationship_invitations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "relationship_analyses" ADD CONSTRAINT "relationship_analyses_user_a_id_user_id_fk"
	FOREIGN KEY ("user_a_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "relationship_analyses" ADD CONSTRAINT "relationship_analyses_user_b_id_user_id_fk"
	FOREIGN KEY ("user_b_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
