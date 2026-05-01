/**
 * Conversation Evidence Repository Tests
 *
 * Tests save, findBySession, and exchange-scoped idempotency using the in-memory mock.
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

	describe("hasEvidenceForExchange", () => {
		it.effect("should detect evidence by exchange", () =>
			Effect.gen(function* () {
				const repo = yield* ConversationEvidenceRepository;
				yield* repo.save([
					makeInput({ exchangeId: "exchange-1" }),
					makeInput({ exchangeId: "exchange-1", bigfiveFacet: "intellect" }),
					makeInput({ exchangeId: "exchange-2", bigfiveFacet: "orderliness" }),
				]);
				const hasExchange1Evidence = yield* repo.hasEvidenceForExchange("exchange-1");
				expect(hasExchange1Evidence).toBe(true);
				const hasExchange2Evidence = yield* repo.hasEvidenceForExchange("exchange-2");
				expect(hasExchange2Evidence).toBe(true);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should return false for unknown exchange", () =>
			Effect.gen(function* () {
				const repo = yield* ConversationEvidenceRepository;
				const hasEvidence = yield* repo.hasEvidenceForExchange("nonexistent");
				expect(hasEvidence).toBe(false);
			}).pipe(Effect.provide(TestLayer)),
		);
	});
});
