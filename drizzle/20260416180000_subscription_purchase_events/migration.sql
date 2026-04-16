ALTER TYPE "purchase_event_type" ADD VALUE 'subscription_started';
--> statement-breakpoint
ALTER TYPE "purchase_event_type" ADD VALUE 'subscription_renewed';
--> statement-breakpoint
ALTER TYPE "purchase_event_type" ADD VALUE 'subscription_cancelled';
--> statement-breakpoint
ALTER TYPE "purchase_event_type" ADD VALUE 'subscription_expired';
--> statement-breakpoint
ALTER TABLE "purchase_events" ADD COLUMN "polar_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "purchase_events" ADD CONSTRAINT "purchase_events_subscription_id_required_check" CHECK (("event_type" NOT IN ('subscription_started', 'subscription_renewed', 'subscription_cancelled', 'subscription_expired')) OR "polar_subscription_id" IS NOT NULL);
--> statement-breakpoint
CREATE INDEX "purchase_events_polar_subscription_id_idx" ON "purchase_events" USING btree ("polar_subscription_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_events_sub_started_unique" ON "purchase_events" ("polar_subscription_id") WHERE "event_type" = 'subscription_started' AND "polar_subscription_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_events_sub_cancelled_unique" ON "purchase_events" ("polar_subscription_id") WHERE "event_type" = 'subscription_cancelled' AND "polar_subscription_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_events_sub_expired_unique" ON "purchase_events" ("polar_subscription_id") WHERE "event_type" = 'subscription_expired' AND "polar_subscription_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_events_sub_renewed_period_unique" ON "purchase_events" ("polar_subscription_id",("metadata"->>'renewalPeriodEnd')) WHERE "event_type" = 'subscription_renewed' AND "polar_subscription_id" IS NOT NULL AND ("metadata"->>'renewalPeriodEnd') IS NOT NULL;
