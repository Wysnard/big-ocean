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
	assessmentTurnCount: 15,
	portraitWaitMinMs: 2000,
	shareMinConfidence: 70,
	conversanalyzerModelId: "claude-haiku-4-5-20251001",
	portraitGeneratorModelId: "claude-sonnet-4-6",
	messageRateLimit: 2,
	polarAccessToken: Redacted.make("test-polar-access-token"),
	polarWebhookSecret: Redacted.make("test-polar-webhook-secret"),
	polarProductPortraitUnlock: "polar_product_portrait",
	polarProductRelationshipSingle: "polar_product_single",
	polarProductRelationship5Pack: "polar_product_5pack",
	polarProductExtendedConversation: "polar_product_extended",
	globalDailyAssessmentLimit: 100,
	minEvidenceWeight: 0.36,
	// Email Infrastructure (Story 31-7)
	resendApiKey: Redacted.make("test-resend-api-key"),
	emailFromAddress: "noreply@test.bigocean.dev",
	dropOffThresholdHours: 24,
	checkInThresholdDays: 14,
	subscriptionNudgeThresholdDays: 21,
	recaptureThresholdDays: 3,
	// Cost Guard (Story 31-6)
	sessionCostLimitCents: 2000,
	// Nerin Director (Story 43-3)
	nerinDirectorModelId: "claude-haiku-4-5-20251001",
	nerinDirectorMaxTokens: 1024,
	nerinDirectorTemperature: 0.7,
	nerinDirectorRetryTemperature: 0.9,
	cronSecret: Redacted.make(""),
};

export const createTestAppConfigLayer = () => Layer.succeed(AppConfig, mockAppConfig);
