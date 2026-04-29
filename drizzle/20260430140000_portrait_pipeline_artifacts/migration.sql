-- ADR-51: persist SpineBrief + SpineVerification + pipeline model audit on portraits
ALTER TABLE "portraits" ADD COLUMN IF NOT EXISTS "spine_brief" jsonb;
ALTER TABLE "portraits" ADD COLUMN IF NOT EXISTS "spine_verification" jsonb;
ALTER TABLE "portraits" ADD COLUMN IF NOT EXISTS "portrait_pipeline_models" jsonb;
