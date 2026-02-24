/**
 * AppConfigLive Tests — Required Variables + Default Values + Type Safety
 */

import { AppConfig } from "@workspace/domain";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { AppConfigLive } from "../app-config.live";
import { createProvider, validEnv } from "./__fixtures__/app-config.fixtures";

describe("AppConfigLive", () => {
	describe("Required Variables", () => {
		it("should fail when DATABASE_URL is missing", async () => {
			const provider = createProvider({
				ANTHROPIC_API_KEY: "sk-test",
				BETTER_AUTH_SECRET: "test-secret-32-chars-minimum-req",
			});

			const program = Effect.gen(function* () {
				yield* AppConfig;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			await expect(Effect.runPromise(program)).rejects.toThrow(/DATABASE_URL/);
		});

		it("should fail when ANTHROPIC_API_KEY is missing", async () => {
			const provider = createProvider({
				DATABASE_URL: "postgres://localhost/test",
				BETTER_AUTH_SECRET: "test-secret-32-chars-minimum-req",
			});

			const program = Effect.gen(function* () {
				yield* AppConfig;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			await expect(Effect.runPromise(program)).rejects.toThrow(/ANTHROPIC_API_KEY/);
		});

		it("should fail when BETTER_AUTH_SECRET is missing", async () => {
			const provider = createProvider({
				DATABASE_URL: "postgres://localhost/test",
				ANTHROPIC_API_KEY: "sk-test",
			});

			const program = Effect.gen(function* () {
				yield* AppConfig;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			await expect(Effect.runPromise(program)).rejects.toThrow(/BETTER_AUTH_SECRET/);
		});

		it("should load successfully when all required variables are present", async () => {
			const provider = createProvider(validEnv);

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return config.databaseUrl;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const result = await Effect.runPromise(program);
			expect(result).toBe("postgres://localhost/test");
		});
	});

	describe("Default Values", () => {
		it("should default PORT to 4000 when not provided", async () => {
			const provider = createProvider(validEnv);

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return config.port;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const port = await Effect.runPromise(program);
			expect(port).toBe(4000);
		});

		it("should default REDIS_URL to redis://localhost:6379 when not provided", async () => {
			const provider = createProvider(validEnv);

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return config.redisUrl;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const redisUrl = await Effect.runPromise(program);
			expect(redisUrl).toBe("redis://localhost:6379");
		});

		it("should default BETTER_AUTH_URL to http://localhost:4000 when not provided", async () => {
			const provider = createProvider(validEnv);

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return config.betterAuthUrl;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const betterAuthUrl = await Effect.runPromise(program);
			expect(betterAuthUrl).toBe("http://localhost:4000");
		});

		it("should default FRONTEND_URL to http://localhost:3000 when not provided", async () => {
			const provider = createProvider(validEnv);

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return config.frontendUrl;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const frontendUrl = await Effect.runPromise(program);
			expect(frontendUrl).toBe("http://localhost:3000");
		});

		it("should default NODE_ENV to development when not provided", async () => {
			const provider = createProvider(validEnv);

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return config.nodeEnv;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const nodeEnv = await Effect.runPromise(program);
			expect(nodeEnv).toBe("development");
		});
	});

	describe("Type Safety", () => {
		it("should parse PORT as number", async () => {
			const provider = createProvider({
				...validEnv,
				PORT: "3000",
			});

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return config.port;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const port = await Effect.runPromise(program);
			expect(port).toBe(3000);
			expect(typeof port).toBe("number");
		});

		it("should use custom PORT when provided", async () => {
			const provider = createProvider({
				...validEnv,
				PORT: "8080",
			});

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return config.port;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const port = await Effect.runPromise(program);
			expect(port).toBe(8080);
		});

		it("should use custom REDIS_URL when provided", async () => {
			const provider = createProvider({
				...validEnv,
				REDIS_URL: "redis://custom-host:6380",
			});

			const program = Effect.gen(function* () {
				const config = yield* AppConfig;
				return config.redisUrl;
			}).pipe(Effect.provide(AppConfigLive), Effect.withConfigProvider(provider));

			const redisUrl = await Effect.runPromise(program);
			expect(redisUrl).toBe("redis://custom-host:6380");
		});
	});
});
