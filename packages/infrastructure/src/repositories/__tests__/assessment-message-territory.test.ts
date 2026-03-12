/**
 * Assessment Message Exchange Metadata Tests (Story 23-3)
 *
 * Verifies that saveMessage handles exchangeId parameter correctly,
 * both with and without the optional exchange link.
 *
 * Replaces old territory/energy metadata tests (Story 21-6) —
 * territory and energy now live on assessment_exchange.
 */
import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/assessment-message.drizzle.repository");

import { AssessmentMessageRepository } from "@workspace/domain";
import {
	_resetMockState,
	AssessmentMessageDrizzleRepositoryLive,
} from "@workspace/infrastructure/repositories/assessment-message.drizzle.repository";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

const TestLayer = AssessmentMessageDrizzleRepositoryLive;

describe("Assessment Message Exchange Metadata (Story 23-3)", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it("saves message with exchange_id", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;
			const msg = yield* repo.saveMessage(
				"session-1",
				"assistant",
				"Tell me about your work",
				"exchange-abc",
			);
			return msg;
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.exchangeId).toBe("exchange-abc");
	});

	it("saves message without exchange_id (null)", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;
			const msg = yield* repo.saveMessage("session-1", "assistant", "Tell me more");
			return msg;
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.exchangeId).toBeNull();
	});

	it("retrieves messages with exchange metadata", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;
			yield* repo.saveMessage("session-2", "user", "I think...", "exchange-1");
			yield* repo.saveMessage("session-2", "assistant", "Response 1", "exchange-1");
			const messages = yield* repo.getMessages("session-2");
			return messages;
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result).toHaveLength(2);
		expect(result[0]?.exchangeId).toBe("exchange-1");
		expect(result[1]?.exchangeId).toBe("exchange-1");
	});

	it("user messages without exchange have null exchangeId", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;
			const msg = yield* repo.saveMessage("session-3", "user", "Hello");
			return msg;
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.exchangeId).toBeNull();
	});
});
