-- Add ON DELETE CASCADE to relationship_analyses FK references to assessment_results
ALTER TABLE "relationship_analyses" DROP CONSTRAINT "relationship_analyses_user_a_result_id_fkey";
ALTER TABLE "relationship_analyses" ADD CONSTRAINT "relationship_analyses_user_a_result_id_fkey"
  FOREIGN KEY ("user_a_result_id") REFERENCES "assessment_results"("id") ON DELETE CASCADE;

ALTER TABLE "relationship_analyses" DROP CONSTRAINT "relationship_analyses_user_b_result_id_fkey";
ALTER TABLE "relationship_analyses" ADD CONSTRAINT "relationship_analyses_user_b_result_id_fkey"
  FOREIGN KEY ("user_b_result_id") REFERENCES "assessment_results"("id") ON DELETE CASCADE;
