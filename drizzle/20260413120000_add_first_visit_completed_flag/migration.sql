-- Story 1-1: track whether a user has completed their first Me-page visit

ALTER TABLE "user"
ADD COLUMN "first_visit_completed" boolean DEFAULT false NOT NULL;
