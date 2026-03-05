/**
 * Assessment Message Territory Metadata Tests (Story 21-6)
 *
 * Verifies that saveMessage handles territoryId and observedEnergyLevel
 * parameters correctly, both with and without the new fields.
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

describe("Assessment Message Territory Metadata", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it("saves message with territory metadata", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;
			const msg = yield* repo.saveMessage(
				"session-1",
				"assistant",
				"Tell me about your work",
				undefined,
				"work",
				"imagination",
				"story_pull",
				"creative-pursuits",
				"medium",
			);
			return msg;
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.territoryId).toBe("creative-pursuits");
		expect(result.observedEnergyLevel).toBe("medium");
	});

	it("saves message without territory metadata (backward compatible)", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;
			const msg = yield* repo.saveMessage(
				"session-1",
				"assistant",
				"Tell me more",
				undefined,
				"work",
				"imagination",
				"explore",
			);
			return msg;
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.territoryId).toBeNull();
		expect(result.observedEnergyLevel).toBeNull();
	});

	it("retrieves messages with territory metadata", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;
			yield* repo.saveMessage(
				"session-2",
				"assistant",
				"Response 1",
				undefined,
				"work",
				"imagination",
				"explore",
				"social-dynamics",
				"heavy",
			);
			yield* repo.saveMessage("session-2", "user", "I think...", "user-1");
			const messages = yield* repo.getMessages("session-2");
			return messages;
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result).toHaveLength(2);
		expect(result[0]?.territoryId).toBe("social-dynamics");
		expect(result[0]?.observedEnergyLevel).toBe("heavy");
	});

	it("user messages have null territory metadata", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* AssessmentMessageRepository;
			const msg = yield* repo.saveMessage("session-3", "user", "Hello", "user-1");
			return msg;
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.territoryId).toBeNull();
		expect(result.observedEnergyLevel).toBeNull();
	});
});
