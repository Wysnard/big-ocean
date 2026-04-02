/**
 * Conversation Evidence Repository Tests
 *
 * Tests save, findBySession, and countByMessage using the in-memory mock.
 * Story 10.1, updated for Evidence v2 (Story 18-1)
 */
import { vi } from "vitest";

vi.mock("../conversation-evidence.drizzle.repository");

import { describe, expect, it } from "@effect/vitest";
import type { ConversationEvidenceInput } from "@workspace/domain";
import { ConversationEvidenceRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import {
	_resetMockState,
	ConversationEvidenceDrizzleRepositoryLive,
} from "../conversation-evidence.drizzle.repository";

const TestLayer = Layer.mergeAll(ConversationEvidenceDrizzleRepositoryLive);

describe("ConversationEvidenceRepository", () => {
	beforeEach(() => {
		_resetMockState();
	});

	const makeInput = (overrides?: Partial<ConversationEvidenceInput>): ConversationEvidenceInput => ({
		sessionId: "session-1",
		messageId: "msg-1",
		exchangeId: "exchange-1",
		bigfiveFacet: "imagination",
		polarity: "high" as const,
		strength: "moderate",
		confidence: "medium",
		domain: "work",
		note: "Shows creative thinking",
		...overrides,
	});

	describe("save", () => {
		it.effect("should save a single record", () =>
			Effect.gen(function* () {
				const repo = yield* ConversationEvidenceRepository;
				yield* repo.save([makeInput()]);
				const records = yield* repo.findBySession("session-1");
				expect(records).toHaveLength(1);
				expect(records[0]?.bigfiveFacet).toBe("imagination");
				expect(records[0]?.deviation).toBe(2);
				expect(records[0]?.strength).toBe("moderate");
				expect(records[0]?.confidence).toBe("medium");
				expect(records[0]?.domain).toBe("work");
				expect(records[0]?.note).toBe("Shows creative thinking");
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should save multiple records", () =>
			Effect.gen(function* () {
				const repo = yield* ConversationEvidenceRepository;
				yield* repo.save([
					makeInput({ bigfiveFacet: "imagination" }),
					makeInput({ bigfiveFacet: "intellect", polarity: "high" as const, strength: "weak" as const }),
					makeInput({
						bigfiveFacet: "orderliness",
						polarity: "low" as const,
						strength: "weak" as const,
						domain: "family",
					}),
				]);
				const records = yield* repo.findBySession("session-1");
				expect(records).toHaveLength(3);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should handle empty array", () =>
			Effect.gen(function* () {
				const repo = yield* ConversationEvidenceRepository;
				yield* repo.save([]);
				const records = yield* repo.findBySession("session-1");
				expect(records).toHaveLength(0);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("findBySession", () => {
		it.effect("should return only records for the given session", () =>
			Effect.gen(function* () {
				const repo = yield* ConversationEvidenceRepository;
				yield* repo.save([
					makeInput({ sessionId: "session-1" }),
					makeInput({ sessionId: "session-2", bigfiveFacet: "intellect" }),
					makeInput({ sessionId: "session-1", bigfiveFacet: "orderliness" }),
				]);
				const s1 = yield* repo.findBySession("session-1");
				expect(s1).toHaveLength(2);
				const s2 = yield* repo.findBySession("session-2");
				expect(s2).toHaveLength(1);
				expect(s2[0]?.bigfiveFacet).toBe("intellect");
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should return empty array for unknown session", () =>
			Effect.gen(function* () {
				const repo = yield* ConversationEvidenceRepository;
				const records = yield* repo.findBySession("nonexistent");
				expect(records).toHaveLength(0);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("countByMessage", () => {
		it.effect("should return correct count", () =>
			Effect.gen(function* () {
				const repo = yield* ConversationEvidenceRepository;
				yield* repo.save([
					makeInput({ messageId: "msg-1" }),
					makeInput({ messageId: "msg-1", bigfiveFacet: "intellect" }),
					makeInput({ messageId: "msg-2", bigfiveFacet: "orderliness" }),
				]);
				const count1 = yield* repo.countByMessage("msg-1");
				expect(count1).toBe(2);
				const count2 = yield* repo.countByMessage("msg-2");
				expect(count2).toBe(1);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should return 0 for unknown message", () =>
			Effect.gen(function* () {
				const repo = yield* ConversationEvidenceRepository;
				const count = yield* repo.countByMessage("nonexistent");
				expect(count).toBe(0);
			}).pipe(Effect.provide(TestLayer)),
		);
	});
});
