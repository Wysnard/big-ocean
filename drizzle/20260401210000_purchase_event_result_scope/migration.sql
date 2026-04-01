-- Scope portrait purchases to specific assessment results.
-- One purchase = one portrait for one result.

ALTER TABLE "purchase_events" ADD COLUMN "assessment_result_id" uuid REFERENCES "assessment_results"("id") ON DELETE SET NULL;
CREATE INDEX "purchase_events_assessment_result_id_idx" ON "purchase_events" ("assessment_result_id");
