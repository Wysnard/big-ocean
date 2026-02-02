/**
 * Test Configuration Factory Tests
 */
import { describe, it, expect } from "vitest";
import { Effect, Redacted } from "effect";
import { AppConfig } from "@workspace/domain";
import {
  createTestAppConfig,
  AppConfigTestLive,
  defaultTestConfig,
} from "../app-config.testing.js";

describe("Test Configuration Factory", () => {
  describe("createTestAppConfig", () => {
    it("should create a Layer with default test values", async () => {
      const program = Effect.gen(function* () {
        const config = yield* AppConfig;
        return {
          port: config.port,
          nodeEnv: config.nodeEnv,
          databaseUrl: config.databaseUrl,
        };
      }).pipe(Effect.provide(createTestAppConfig()));

      const result = await Effect.runPromise(program);
      expect(result.port).toBe(4000);
      expect(result.nodeEnv).toBe("test");
      expect(result.databaseUrl).toBe("postgres://test:test@localhost:5432/test");
    });

    it("should allow overriding individual config values", async () => {
      const customLayer = createTestAppConfig({
        port: 8080,
        nodeEnv: "production",
      });

      const program = Effect.gen(function* () {
        const config = yield* AppConfig;
        return {
          port: config.port,
          nodeEnv: config.nodeEnv,
        };
      }).pipe(Effect.provide(customLayer));

      const result = await Effect.runPromise(program);
      expect(result.port).toBe(8080);
      expect(result.nodeEnv).toBe("production");
    });

    it("should preserve non-overridden values", async () => {
      const customLayer = createTestAppConfig({
        port: 9000,
      });

      const program = Effect.gen(function* () {
        const config = yield* AppConfig;
        return {
          port: config.port,
          nodeEnv: config.nodeEnv,
          redisUrl: config.redisUrl,
        };
      }).pipe(Effect.provide(customLayer));

      const result = await Effect.runPromise(program);
      expect(result.port).toBe(9000);
      expect(result.nodeEnv).toBe("test"); // Default preserved
      expect(result.redisUrl).toBe("redis://localhost:6379"); // Default preserved
    });

    it("should allow overriding Redacted secrets", async () => {
      const customKey = "custom-api-key-for-testing";
      const customLayer = createTestAppConfig({
        anthropicApiKey: Redacted.make(customKey),
      });

      const program = Effect.gen(function* () {
        const config = yield* AppConfig;
        return Redacted.value(config.anthropicApiKey);
      }).pipe(Effect.provide(customLayer));

      const result = await Effect.runPromise(program);
      expect(result).toBe(customKey);
    });
  });

  describe("AppConfigTestLive", () => {
    it("should provide default test configuration", async () => {
      const program = Effect.gen(function* () {
        const config = yield* AppConfig;
        return config.port;
      }).pipe(Effect.provide(AppConfigTestLive));

      const result = await Effect.runPromise(program);
      expect(result).toBe(4000);
    });
  });

  describe("defaultTestConfig", () => {
    it("should have all required fields", () => {
      expect(defaultTestConfig.databaseUrl).toBeDefined();
      expect(defaultTestConfig.redisUrl).toBeDefined();
      expect(defaultTestConfig.anthropicApiKey).toBeDefined();
      expect(defaultTestConfig.betterAuthSecret).toBeDefined();
      expect(defaultTestConfig.betterAuthUrl).toBeDefined();
      expect(defaultTestConfig.frontendUrl).toBeDefined();
      expect(defaultTestConfig.port).toBeDefined();
      expect(defaultTestConfig.nodeEnv).toBeDefined();
    });

    it("should have nodeEnv set to test", () => {
      expect(defaultTestConfig.nodeEnv).toBe("test");
    });
  });
});
