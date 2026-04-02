/**
 * ConversAnalyzer State Classification Tests (Story 24-1, Story 42-2)
 *
 * Verifies that the split extraction mock returns expected user state defaults
 * and can be overridden via _setMockOutput.
 */
import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/conversanalyzer.anthropic.repository");

import type { ConversanalyzerV2Output } from "@workspace/domain";
import { ConversanalyzerRepository } from "@workspace/domain";
import {
	_getMockCalls,
	_resetMockState,
	_setMockOutput,
	ConversanalyzerAnthropicRepositoryLive,
} from "@workspace/infrastructure/repositories/conversanalyzer.anthropic.repository";
import { Effect } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

const TestLayer = ConversanalyzerAnthropicRepositoryLive;

const defaultInput = {
	message: "I work in tech",
	recentMessages: [{ id: "1", role: "user" as const, content: "I work in tech" }],
	domainDistribution: { work: 0, relationships: 0, family: 0, leisure: 0, health: 0, other: 0 },
};

describe("ConversAnalyzer State Classification (split)", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it("analyzeUserState returns energyBand: steady and tellingBand: mixed by default", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* ConversanalyzerRepository;
			return yield* repo.analyzeUserState(defaultInput);
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.userState.energyBand).toBe("steady");
		expect(result.userState.tellingBand).toBe("mixed");
		expect(result.userState.withinMessageShift).toBe(false);
	});

	it("analyzeUserStateLenient returns same defaults", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* ConversanalyzerRepository;
			return yield* repo.analyzeUserStateLenient(defaultInput);
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.userState.energyBand).toBe("steady");
		expect(result.userState.tellingBand).toBe("mixed");
	});

	it("userState can be overridden via _setMockOutput", async () => {
		const customOutput: ConversanalyzerV2Output = {
			userState: {
				energyBand: "very_high",
				tellingBand: "strongly_self_propelled",
				energyReason: "Deeply personal",
				tellingReason: "Ignoring prompt entirely",
				withinMessageShift: true,
			},
			evidence: [],
			tokenUsage: { input: 0, output: 0 },
		};
		_setMockOutput(customOutput);

		const program = Effect.gen(function* () {
			const repo = yield* ConversanalyzerRepository;
			return yield* repo.analyzeUserState({
				...defaultInput,
				message: "My dad left when I was five",
			});
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(result.userState.energyBand).toBe("very_high");
		expect(result.userState.tellingBand).toBe("strongly_self_propelled");
		expect(result.userState.withinMessageShift).toBe(true);
	});

	it("mock tracks calls correctly", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* ConversanalyzerRepository;
			return yield* repo.analyzeUserState(defaultInput);
		});

		await Effect.runPromise(Effect.provide(program, TestLayer));

		const calls = _getMockCalls();
		expect(calls).toHaveLength(1);
		expect(calls[0]?.message).toBe("I work in tech");
	});
});
