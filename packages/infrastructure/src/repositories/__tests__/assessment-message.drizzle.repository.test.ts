/**
 * Assessment Message Repository Tests
 *
 * Story 10.4 (Task 1.3): Verify targetDomain and targetBigfiveFacet round-trip
 * through saveMessage → getMessages using the in-memory mock.
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

describe("AssessmentMessageRepository — steering fields round-trip (Story 10.4)", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect(
		"should persist and retrieve targetDomain and targetBigfiveFacet on assistant messages",
		() =>
			Effect.gen(function* () {
				const repo = yield* AssessmentMessageRepository;

				yield* repo.saveMessage(
					"session-1",
					"assistant",
					"Hello!",
					undefined,
					"leisure",
					"imagination",
				);

				const messages = yield* repo.getMessages("session-1");
				expect(messages).toHaveLength(1);

				const msg = messages[0];
				expect(msg).toBeDefined();
				expect(msg?.role).toBe("assistant");
				expect("targetDomain" in msg!).toBe(true);
				if ("targetDomain" in msg!) {
					expect(msg?.targetDomain).toBe("leisure");
					expect(msg?.targetBigfiveFacet).toBe("imagination");
				}
			}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should return null targetDomain and targetBigfiveFacet when not provided", () =>
		Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;

			yield* repo.saveMessage("session-1", "assistant", "Hello!");

			const messages = yield* repo.getMessages("session-1");
			const msg = messages[0];
			expect(msg).toBeDefined();
			if ("targetDomain" in msg!) {
				expect(msg?.targetDomain).toBeNull();
				expect(msg?.targetBigfiveFacet).toBeNull();
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should return messages in insertion order across roles", () =>
		Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;

			yield* repo.saveMessage("session-1", "user", "Hello", "user-123");
			yield* repo.saveMessage("session-1", "assistant", "Hi!", undefined, "work", "orderliness");

			const messages = yield* repo.getMessages("session-1");
			expect(messages).toHaveLength(2);
			expect(messages[0]?.role).toBe("user");
			expect(messages[1]?.role).toBe("assistant");

			const assistant = messages[1]!;
			if ("targetDomain" in assistant) {
				expect(assistant.targetDomain).toBe("work");
				expect(assistant.targetBigfiveFacet).toBe("orderliness");
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});
