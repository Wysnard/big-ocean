/**
 * Drizzle Kit Configuration
 *
 * Used for generating and applying database migrations.
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./packages/infrastructure/src/db/drizzle/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "postgresql://dev:devpassword@localhost:5432/bigocean",
	},
});
