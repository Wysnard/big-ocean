/**
 * ConversAnalyzer Energy Classification Tests (Story 21-6)
 *
 * Verifies that ConversanalyzerOutput includes observedEnergyLevel
 * and the mock returns appropriate defaults.
 */
import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/conversanalyzer.anthropic.repository");

import type { ConversanalyzerOutput } from "@workspace/domain";
import { ConversanalyzerRepository } from "@workspace/domain";
import {
	_getMockCalls,
	_resetMockState,
	_setMockOutput,
	ConversanalyzerAnthropicRepositoryLive,
} from "@workspace/infrastructure/repositories/conversanalyzer.anthropic.repository";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

const TestLayer = ConversanalyzerAnthropicRepositoryLive;

describe("ConversAnalyzer Energy Classification", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it("mock returns observedEnergyLevel: medium by default", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* ConversanalyzerRepository;
			return yield* repo.analyze({
				message: "I work in tech",
				recentMessages: [{ id: "1", role: "user", content: "I work in tech" }],
				domainDistribution: { work: 0, relationships: 0, family: 0, leisure: 0, solo: 0, other: 0 },
			});
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.observedEnergyLevel).toBe("medium");
	});

	it("observedEnergyLevel can be overridden via _setMockOutput", async () => {
		const customOutput: ConversanalyzerOutput = {
			evidence: [],
			observedEnergyLevel: "heavy",
			tokenUsage: { input: 0, output: 0 },
		};
		_setMockOutput(customOutput);

		const program = Effect.gen(function* () {
			const repo = yield* ConversanalyzerRepository;
			return yield* repo.analyze({
				message: "My dad left when I was five",
				recentMessages: [{ id: "1", role: "user", content: "My dad left when I was five" }],
				domainDistribution: { work: 0, relationships: 0, family: 0, leisure: 0, solo: 0, other: 0 },
			});
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.observedEnergyLevel).toBe("heavy");
	});

	it("observedEnergyLevel can be set to light", async () => {
		const customOutput: ConversanalyzerOutput = {
			evidence: [],
			observedEnergyLevel: "light",
			tokenUsage: { input: 0, output: 0 },
		};
		_setMockOutput(customOutput);

		const program = Effect.gen(function* () {
			const repo = yield* ConversanalyzerRepository;
			return yield* repo.analyze({
				message: "Hello!",
				recentMessages: [{ id: "1", role: "user", content: "Hello!" }],
				domainDistribution: { work: 0, relationships: 0, family: 0, leisure: 0, solo: 0, other: 0 },
			});
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.observedEnergyLevel).toBe("light");
	});

	it("mock tracks calls correctly with energy output", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* ConversanalyzerRepository;
			return yield* repo.analyze({
				message: "test message",
				recentMessages: [{ id: "1", role: "user", content: "test message" }],
				domainDistribution: { work: 0, relationships: 0, family: 0, leisure: 0, solo: 0, other: 0 },
			});
		});

		await Effect.runPromise(Effect.provide(program, TestLayer));

		const calls = _getMockCalls();
		expect(calls).toHaveLength(1);
		expect(calls[0]?.message).toBe("test message");
	});
});
