/**
 * Resume Session Pipeline Tests (Story 31-5)
 *
 * Verifies that the pacing pipeline correctly resumes from the last exchange
 * state after a session resume (browser close and return).
 *
 * The key assertion: when sending a message after resume, the exchange
 * turn number continues correctly from where the conversation left off.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Effect } from "effect";
import { sendMessage } from "../send-message.use-case";
import {
	createTestLayer,
	mockActorResponse,
	mockExchangeRepo,
	mockMessageRepo,
	mockSessionRepo,
	openerExchangeRecord,
	setupDefaultMocks,
} from "./__fixtures__/send-message.fixtures";

describe("Pacing pipeline resume (Story 31-5)", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it.effect("continues from correct turn number after resume with 3 prior exchanges", () =>
		Effect.gen(function* () {
			// Simulate a resumed session with 3 completed exchanges (turns 1-3)
			// plus the opener exchange (turn 0)
			const priorExchanges = [
				openerExchangeRecord,
				{
					...openerExchangeRecord,
					id: "exchange_1",
					turnNumber: 1,
					extractionTier: 1,
				},
				{
					...openerExchangeRecord,
					id: "exchange_2",
					turnNumber: 2,
					extractionTier: 1,
				},
				{
					...openerExchangeRecord,
					id: "exchange_3",
					turnNumber: 3,
					extractionTier: 1,
				},
			];

			// Session has 8 messages (2 greetings + 3 user + 3 assistant)
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({
					id: "session_test_123",
					userId: "user_456",
					createdAt: new Date("2026-02-01"),
					updatedAt: new Date("2026-02-01"),
					status: "active",
					messageCount: 8,
					finalizationProgress: null,
				}),
			);

			// Post-cold-start: 3+ user messages, so ConversAnalyzer runs
			const resumedMessages = [
				{
					id: "msg_1",
					sessionId: "session_test_123",
					role: "assistant" as const,
					content: "Hi!",
					createdAt: new Date(),
				},
				{
					id: "msg_2",
					sessionId: "session_test_123",
					role: "assistant" as const,
					content: "Question?",
					createdAt: new Date(),
				},
				{
					id: "msg_3",
					sessionId: "session_test_123",
					role: "user" as const,
					content: "Answer 1",
					createdAt: new Date(),
				},
				{
					id: "msg_4",
					sessionId: "session_test_123",
					role: "assistant" as const,
					content: "Next?",
					createdAt: new Date(),
				},
				{
					id: "msg_5",
					sessionId: "session_test_123",
					role: "user" as const,
					content: "Answer 2",
					createdAt: new Date(),
				},
				{
					id: "msg_6",
					sessionId: "session_test_123",
					role: "assistant" as const,
					content: "More?",
					createdAt: new Date(),
				},
				{
					id: "msg_7",
					sessionId: "session_test_123",
					role: "user" as const,
					content: "Answer 3",
					createdAt: new Date(),
				},
				{
					id: "msg_8",
					sessionId: "session_test_123",
					role: "assistant" as const,
					content: "Go on",
					createdAt: new Date(),
				},
			];
			mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(resumedMessages));

			mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(priorExchanges));

			// Track what turn number is used when creating the new exchange
			let capturedTurnNumber: number | undefined;
			mockExchangeRepo.create.mockImplementation((sessionId: string, turnNumber: number) => {
				capturedTurnNumber = turnNumber;
				return Effect.succeed({
					...openerExchangeRecord,
					id: "exchange_4",
					sessionId,
					turnNumber,
				});
			});

			const result = yield* sendMessage({
				sessionId: "session_test_123",
				message: "Answer 4 — after resume",
				userId: "user_456",
			});

			expect(result.response).toBe(mockActorResponse.response);

			// The key assertion: turn number should be 4 (continuing from 3 prior exchanges)
			expect(capturedTurnNumber).toBe(4);
		}).pipe(Effect.provide(createTestLayer())),
	);
});
