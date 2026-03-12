/**
 * Assessment Message Repository Tests
 *
 * Verifies saveMessage -> getMessages round-trip using the in-memory mock.
 *
 * Story 23-3: Updated for simplified saveMessage signature (no userId/territoryId/observedEnergyLevel).
 */
import { vi } from "vitest";

vi.mock("../assessment-message.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { AssessmentMessageRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import {
	_resetMockState,
	AssessmentMessageDrizzleRepositoryLive,
} from "../assessment-message.drizzle.repository";

const TestLayer = Layer.mergeAll(AssessmentMessageDrizzleRepositoryLive);

describe("AssessmentMessageRepository — round-trip", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect("should persist and retrieve exchangeId on messages", () =>
		Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;

			yield* repo.saveMessage("session-1", "assistant", "Hello!", "exchange-1");

			const messages = yield* repo.getMessages("session-1");
			expect(messages).toHaveLength(1);

			const msg = messages[0];
			expect(msg).toBeDefined();
			expect(msg?.role).toBe("assistant");
			expect(msg?.exchangeId).toBe("exchange-1");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should return null exchangeId when not provided", () =>
		Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;

			yield* repo.saveMessage("session-1", "assistant", "Hello!");

			const messages = yield* repo.getMessages("session-1");
			const msg = messages[0];
			expect(msg).toBeDefined();
			expect(msg?.exchangeId).toBeNull();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should return messages in insertion order across roles", () =>
		Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;

			yield* repo.saveMessage("session-1", "user", "Hello");
			yield* repo.saveMessage("session-1", "assistant", "Hi!", "exchange-1");

			const messages = yield* repo.getMessages("session-1");
			expect(messages).toHaveLength(2);
			expect(messages[0]?.role).toBe("user");
			expect(messages[1]?.role).toBe("assistant");

			expect(messages[1]?.exchangeId).toBe("exchange-1");
		}).pipe(Effect.provide(TestLayer)),
	);
});
