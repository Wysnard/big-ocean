/**
 * Test Configuration Factory
 *
 * Provides test implementations of AppConfig for unit testing.
 * Allows overriding individual config values without needing environment variables.
 *
 * @example
 * ```typescript
 * const TestLayer = createTestAppConfig({ port: 8080 });
 *
 * const result = await Effect.runPromise(
 *   myUseCase.pipe(Effect.provide(TestLayer))
 * );
 * ```
 */

import { AppConfig, type AppConfigService } from "@workspace/domain";
import { Layer, Redacted } from "effect";

/**
 * Default test configuration values
 *
 * These provide sensible defaults for testing without needing real environment variables.
 */
export const defaultTestConfig: AppConfigService = {
	databaseUrl: "postgres://test:test@localhost:5432/test",
	redisUrl: "redis://localhost:6379",
	anthropicApiKey: Redacted.make("test-anthropic-api-key"),
	betterAuthSecret: Redacted.make("test-better-auth-secret-minimum-32-chars"),
	betterAuthUrl: "http://localhost:4000",
	frontendUrl: "http://localhost:3000",
	port: 4000,
	nodeEnv: "test",
	analyzerModelId: "claude-sonnet-4-20250514",
	analyzerMaxTokens: 2048,
	analyzerTemperature: 0.3,
	portraitModelId: "claude-sonnet-4-6",
	portraitMaxTokens: 16000,
	portraitTemperature: 0.7,
	nerinModelId: "claude-haiku-4-5-20251001",
	nerinMaxTokens: 1024,
	nerinTemperature: 0.7,
	dailyCostLimit: 75,
	freeTierMessageThreshold: 25,
	shareMinConfidence: 70,
	portraitWaitMinMs: 2000,
};

/**
 * Create a test AppConfig Layer with optional overrides
 *
 * @param overrides - Partial configuration to override defaults
 * @returns Layer that provides AppConfig for testing
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const TestLayer = createTestAppConfig();
 *
 * // Override specific values
 * const CustomTestLayer = createTestAppConfig({
 *   port: 8080,
 *   nodeEnv: "production",
 * });
 *
 * // Override with custom Redacted values
 * const SecretTestLayer = createTestAppConfig({
 *   anthropicApiKey: Redacted.make("custom-test-key"),
 * });
 * ```
 */
export const createTestAppConfig = (
	overrides: Partial<AppConfigService> = {},
): Layer.Layer<AppConfig> =>
	Layer.succeed(AppConfig, {
		...defaultTestConfig,
		...overrides,
	});

/**
 * Pre-built test Layer using all defaults
 *
 * Use this for quick tests that don't need custom configuration.
 */
export const AppConfigTestLive = createTestAppConfig();
