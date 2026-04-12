/**
 * Check Drop-off Use Case Tests (Story 31-7)
 *
 * Verifies drop-off re-engagement email logic:
 * - Finds inactive sessions and sends emails
 * - One-shot enforcement (no duplicate emails)
 * - Fire-and-forget (email failures don't propagate)
 * - Topic derivation from current exchange coverage/director data
 */
import { beforeEach, vi } from "vitest";

vi.mock("@workspace/domain/config/app-config");
vi.mock("@workspace/infrastructure/repositories/conversation.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/exchange.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/resend-email.resend.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { describe, expect, it } from "@effect/vitest";
import {
	ConversationRepository,
	ExchangeRepository,
	ResendEmailRepository,
} from "@workspace/domain";
import { createTestAppConfigLayer } from "@workspace/domain/config/__mocks__/app-config";
import {
	ConversationDrizzleRepositoryLive,
	_resetMockState as resetConversationMockState,
} from "@workspace/infrastructure/repositories/conversation.drizzle.repository";
import {
	ExchangeDrizzleRepositoryLive,
	_resetMockState as resetExchangeMockState,
} from "@workspace/infrastructure/repositories/exchange.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import {
	_getSentEmails,
	ResendEmailResendRepositoryLive,
	_resetMockState as resetEmailMockState,
} from "@workspace/infrastructure/repositories/resend-email.resend.repository";
import { Effect, Layer } from "effect";
import { checkDropOff } from "../check-drop-off.use-case";

describe("checkDropOff use-case", () => {
	beforeEach(() => {
		resetConversationMockState();
		resetExchangeMockState();
		resetEmailMockState();
	});

	const BaseTestLayer = Layer.mergeAll(
		ConversationDrizzleRepositoryLive,
		ExchangeDrizzleRepositoryLive,
		ResendEmailResendRepositoryLive,
		LoggerPinoRepositoryLive,
		createTestAppConfigLayer(),
	);

	it.effect("returns 0 when no drop-off sessions exist", () =>
		Effect.gen(function* () {
			const result = yield* checkDropOff;
			expect(result.emailsSent).toBe(0);
		}).pipe(Effect.provide(BaseTestLayer)),
	);

	it.effect("derives the drop-off topic from the latest exchange and enforces one-shot sends", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* ConversationRepository;
			const exchangeRepo = yield* ExchangeRepository;

			const { sessionId } = yield* sessionRepo.createSession("user-123");
			yield* sessionRepo.updateSession(sessionId, {
				status: "active",
				userId: "user-123",
				userEmail: "alice@example.com",
				userName: "Alice",
			} as any);

			const exchange = yield* exchangeRepo.create(sessionId, 1);
			yield* exchangeRepo.update(exchange.id, {
				directorOutput: "Explore daily routines",
				coverageTargets: {
					primaryFacet: "orderliness",
					candidateDomains: ["work"],
				},
			});

			const result = yield* checkDropOff;
			const sentEmails = _getSentEmails();

			expect(result.emailsSent).toBe(1);
			expect(sentEmails).toHaveLength(1);
			expect(sentEmails[0]?.html).toContain("how orderliness shows up in work and ambition");
			expect(sentEmails[0]?.html).toContain("/chat?sessionId=");

			const secondRun = yield* checkDropOff;
			expect(secondRun.emailsSent).toBe(0);
		}).pipe(Effect.provide(BaseTestLayer)),
	);

	it.effect("handles email send failure gracefully (fail-open)", () => {
		const failingEmailLayer = Layer.succeed(
			ResendEmailRepository,
			ResendEmailRepository.of({
				sendEmail: () => Effect.fail({ _tag: "EmailError", message: "Resend API down" } as any),
			}),
		);

		const testLayer = Layer.mergeAll(
			ConversationDrizzleRepositoryLive,
			ExchangeDrizzleRepositoryLive,
			failingEmailLayer,
			LoggerPinoRepositoryLive,
			createTestAppConfigLayer(),
		);

		return Effect.gen(function* () {
			const sessionRepo = yield* ConversationRepository;
			yield* sessionRepo.createSession("user-456");

			const result = yield* checkDropOff;
			expect(result.emailsSent).toBe(0);
		}).pipe(Effect.provide(testLayer));
	});
});
