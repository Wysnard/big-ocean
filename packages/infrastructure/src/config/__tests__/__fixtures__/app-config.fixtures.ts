import { ConfigProvider } from "effect";

/**
 * Helper to create a config provider from a map of environment variables
 */
export const createProvider = (envVars: Record<string, string>) =>
	ConfigProvider.fromMap(new Map(Object.entries(envVars)));

/**
 * Default valid config for tests that need all required vars
 */
export const validEnv = {
	DATABASE_URL: "postgres://localhost/test",
	ANTHROPIC_API_KEY: "sk-test-key",
	BETTER_AUTH_SECRET: "test-secret-minimum-32-characters-long",
	POLAR_WEBHOOK_SECRET: "test-polar-webhook-secret",
	POLAR_PRODUCT_PORTRAIT_UNLOCK: "polar_product_portrait",
	POLAR_PRODUCT_RELATIONSHIP_SINGLE: "polar_product_single",
	POLAR_PRODUCT_RELATIONSHIP_5PACK: "polar_product_5pack",
	POLAR_PRODUCT_EXTENDED_CONVERSATION: "polar_product_extended",
};
