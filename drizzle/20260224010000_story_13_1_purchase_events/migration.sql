-- Story 13.1: Purchase Events Schema & Capability Derivation

CREATE TYPE "public"."purchase_event_type" AS ENUM('free_credit_granted', 'portrait_unlocked', 'credit_purchased', 'credit_consumed', 'extended_conversation_unlocked', 'portrait_refunded', 'credit_refunded', 'extended_conversation_refunded');

CREATE TABLE "purchase_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_type" "purchase_event_type" NOT NULL,
	"polar_checkout_id" text,
	"polar_product_id" text,
	"amount_cents" integer,
	"currency" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "purchase_events_user_id_idx" ON "purchase_events" USING btree ("user_id");
CREATE UNIQUE INDEX "purchase_events_polar_checkout_id_unique" ON "purchase_events" USING btree ("polar_checkout_id") WHERE polar_checkout_id IS NOT NULL;

ALTER TABLE "purchase_events" ADD CONSTRAINT "purchase_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
