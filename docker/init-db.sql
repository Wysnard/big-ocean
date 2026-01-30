-- Initialize PostgreSQL database for big-ocean development
-- This script runs automatically when PostgreSQL container starts
-- Database and user are created by Docker environment variables

-- Enable required extensions for future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Future migrations for Story 2.1 (Session Management) will create tables here:
-- - sessions table (id, userId, createdAt, precision, status)
-- - messages table (id, sessionId, role, content, createdAt)
-- - trait_assessments table (optional, for normalized scoring)

-- This placeholder ensures database is initialized and ready for Story 2.1
-- See: _bmad-output/implementation-artifacts/2-1-session-management-and-persistence.md
