-- Add "health" to the evidence_domain enum (additive only — no data changes)
-- Health domain captures: exercise, diet, sleep, self-care routines, stress management
-- Solo removal deferred to Story 1.3 after data migration
ALTER TYPE "evidence_domain" ADD VALUE IF NOT EXISTS 'health';
