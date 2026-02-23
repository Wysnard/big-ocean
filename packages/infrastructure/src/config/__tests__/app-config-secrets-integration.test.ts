/**
 * AppConfigLive Tests — Secret Handling + Config Layer + loadConfig
 */

import { AppConfig } from "@workspace/domain";
import { Effect, Redacted } from "effect";
import { describe, expect, it } from "vitest";
import { AppConfigLive, loadConfig } from "../app-config.live";
import { createProvider, validEnv } from "./__fixtures__/app-config.fixtures";

describe("AppConfigLive", () => {
	describe("Secret Handling (Redacted)", () => {
		it("should redact ANTHROPIC_API_KEY when converted to string", async () => {
			const provider = createProvider({
				...validEnv,
				ANTHROPIC_API_KEY: "sk-secret-key-should-not-appear",
			});

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				// Converting Redacted to string should NOT reveal the secret
				return String(config.anthropicApiKey);
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const result = await Effect.runPromise(program);
			expect(result).not.toContain("sk-secret-key");
			// Effect's Redacted shows as "<redacted>" when stringified
			expect(result).toContain("<redacted>");
		});

		it("should redact BETTER_AUTH_SECRET when converted to string", async () => {
			const provider = createProvider({
				...validEnv,
				BETTER_AUTH_SECRET: "super-secret-auth-key-do-not-log",
			});

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return String(config.betterAuthSecret);
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const result = await Effect.runPromise(program);
			expect(result).not.toContain("super-secret");
			// Effect's Redacted shows as "<redacted>" when stringified
			expect(result).toContain("<redacted>");
		});

		it("should allow extracting secret value using Redacted.value", async () => {
			const secretKey = "sk-actual-secret-for-api-calls";
			const provider = createProvider({
				...validEnv,
				ANTHROPIC_API_KEY: secretKey,
			});

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				// Explicitly unwrap for actual use
				return Redacted.value(config.anthropicApiKey);
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const result = await Effect.runPromise(program);
			expect(result).toBe(secretKey);
		});
	});

	describe("Config Layer Integration", () => {
		it("should be providable to effects as a Layer", async () => {
			const provider = createProvider(validEnv);

			// Simulate a use-case that depends on AppConfig
			const useCase = Effect.gen(function* () {
				const config = yield* AppConfig;
				return {
					dbConfigured: config.databaseUrl.length > 0,
					port: config.port,
				};
			});

			const program = useCase.pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const result = await Effect.runPromise(program);
			expect(result.dbConfigured).toBe(true);
			expect(result.port).toBe(4000);
		});
	});

	describe("loadConfig (Effect-based)", () => {
		it("should fail when DATABASE_URL is missing", async () => {
			const provider = createProvider({
				ANTHROPIC_API_KEY: "sk-test",
				BETTER_AUTH_SECRET: "test-secret-32-chars",
			});

			const program = loadConfig.pipe(Effect.withConfigProvider(provider));

			await expect(Effect.runPromise(program)).rejects.toThrow(/DATABASE_URL/);
		});

		it("should fail when ANTHROPIC_API_KEY is missing", async () => {
			const provider = createProvider({
				DATABASE_URL: "postgres://localhost/test",
				BETTER_AUTH_SECRET: "test-secret-32-chars",
			});

			const program = loadConfig.pipe(Effect.withConfigProvider(provider));

			await expect(Effect.runPromise(program)).rejects.toThrow(/ANTHROPIC_API_KEY/);
		});

		it("should fail when BETTER_AUTH_SECRET is missing", async () => {
			const provider = createProvider({
				DATABASE_URL: "postgres://localhost/test",
				ANTHROPIC_API_KEY: "sk-test",
			});

			const program = loadConfig.pipe(Effect.withConfigProvider(provider));

			await expect(Effect.runPromise(program)).rejects.toThrow(/BETTER_AUTH_SECRET/);
		});

		it("should load config when all required vars are present", async () => {
			const provider = createProvider(validEnv);

			const program = loadConfig.pipe(Effect.withConfigProvider(provider));

			const config = await Effect.runPromise(program);

			expect(config.databaseUrl).toBe("postgres://localhost/test");
			expect(Redacted.value(config.anthropicApiKey)).toBe("sk-test-key");
			expect(Redacted.value(config.betterAuthSecret)).toBe("test-secret-minimum-32-characters-long");
		});

		it("should apply default values for optional vars", async () => {
			const provider = createProvider(validEnv);

			const program = loadConfig.pipe(Effect.withConfigProvider(provider));

			const config = await Effect.runPromise(program);

			expect(config.port).toBe(4000);
			expect(config.redisUrl).toBe("redis://localhost:6379");
			expect(config.frontendUrl).toBe("http://localhost:3000");
			expect(config.betterAuthUrl).toBe("http://localhost:4000");
			expect(config.nodeEnv).toBe("development");
		});

		it("should use custom values when provided", async () => {
			const provider = createProvider({
				...validEnv,
				PORT: "8080",
				REDIS_URL: "redis://prod:6379",
				FRONTEND_URL: "https://app.example.com",
				BETTER_AUTH_URL: "https://api.example.com",
				NODE_ENV: "production",
			});

			const program = loadConfig.pipe(Effect.withConfigProvider(provider));

			const config = await Effect.runPromise(program);

			expect(config.port).toBe(8080);
			expect(config.redisUrl).toBe("redis://prod:6379");
			expect(config.frontendUrl).toBe("https://app.example.com");
			expect(config.betterAuthUrl).toBe("https://api.example.com");
			expect(config.nodeEnv).toBe("production");
		});

		it("should redact secrets in returned config", async () => {
			const provider = createProvider({
				...validEnv,
				ANTHROPIC_API_KEY: "sk-secret-key",
				BETTER_AUTH_SECRET: "super-secret-auth-32-chars-min",
			});

			const program = loadConfig.pipe(Effect.withConfigProvider(provider));

			const config = await Effect.runPromise(program);

			// Secrets should be wrapped in Redacted
			expect(String(config.anthropicApiKey)).toContain("<redacted>");
			expect(String(config.betterAuthSecret)).toContain("<redacted>");

			// But can be unwrapped when needed
			expect(Redacted.value(config.anthropicApiKey)).toBe("sk-secret-key");
			expect(Redacted.value(config.betterAuthSecret)).toBe("super-secret-auth-32-chars-min");
		});
	});
});
