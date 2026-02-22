/**
 * Mock implementation for AppConfig
 *
 * Vitest auto-resolves this file when tests call:
 *   vi.mock('@workspace/domain/config/app-config')
 *
 * Exports the real Context.Tag (via vi.importActual) plus mock implementations.
 */

import type { AppConfigService } from "@workspace/domain";
import { Layer, Redacted } from "effect";
import { vi } from "vitest";

// Preserve real exports from original module
const actual = await vi.importActual<typeof import("../app-config")>("../app-config");
export const { AppConfig } = actual;

export const mockAppConfig: AppConfigService = {
	databaseUrl: "postgresql://test:test@localhost:5432/test",
	redisUrl: "redis://localhost:6379",
	anthropicApiKey: Redacted.make("test-api-key"),
	betterAuthSecret: Redacted.make("test-secret"),
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
	dailyCostLimit: 75,
	nerinModelId: "claude-haiku-4-5-20251001",
	nerinMaxTokens: 1024,
	nerinTemperature: 0.7,
	freeTierMessageThreshold: 25,
	portraitWaitMinMs: 2000,
	shareMinConfidence: 70,
};

export const createTestAppConfigLayer = () => Layer.succeed(AppConfig, mockAppConfig);
