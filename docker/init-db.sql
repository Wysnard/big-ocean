-- Initialize PostgreSQL database for big-ocean development
-- This script runs automatically when PostgreSQL container starts
-- Database and user are created by Docker environment variables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drizzle migration tracking schema
CREATE SCHEMA IF NOT EXISTS "drizzle";

-- Tables are managed by Drizzle ORM migrations.
-- Run `pnpm db:migrate` or `pnpm db:push` to apply the schema.
-- Migrations run automatically on backend startup in Docker.
