/**
 * Mock: conversanalyzer.anthropic.repository.ts (v2)
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/conversanalyzer.anthropic.repository')
 *
 * Returns deterministic v2 output with userState + evidence.
 * Story 10.2 (v1), Story 24-1 (v2 evolution)
 */
import {
	ConversanalyzerError,
	type ConversanalyzerInput,
	ConversanalyzerRepository,
	type ConversanalyzerV2Output,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

let _callCount = 0;
const calls: ConversanalyzerInput[] = [];

/** Clear in-memory state between tests */
export const _resetMockState = () => {
	_callCount = 0;
	calls.length = 0;
	overrideOutput = null;
	overrideError = null;
};

/** Read-only access for test assertions */
export const _getMockCalls = () => [...calls];

/** Default deterministic v2 output — steady/mixed state, 2 balanced evidence records */
const defaultOutput: ConversanalyzerV2Output = {
	userState: {
		energyBand: "steady",
		tellingBand: "mixed",
		energyReason: "Engaged with moderate self-reflection",
		tellingReason: "Follows prompts with some self-direction",
		withinMessageShift: false,
	},
	evidence: [
		{
			bigfiveFacet: "imagination",
			deviation: 1,
			strength: "moderate",
			confidence: "medium",
			domain: "work",
			note: "Shows creative thinking in professional context",
		},
		{
			bigfiveFacet: "trust",
			deviation: 1,
			strength: "weak",
			confidence: "medium",
			domain: "relationships",
			note: "Indicates baseline trust in social interactions",
		},
	],
	tokenUsage: { input: 0, output: 0 },
};

/** Override the mock output for specific tests */
let overrideOutput: ConversanalyzerV2Output | null = null;
let overrideError: string | null = null;

export const _setMockOutput = (output: ConversanalyzerV2Output) => {
	overrideOutput = output;
};

export const _setMockError = (message: string) => {
	overrideError = message;
};

export const ConversanalyzerAnthropicRepositoryLive = Layer.succeed(
	ConversanalyzerRepository,
	ConversanalyzerRepository.of({
		analyze: (params: ConversanalyzerInput) => {
			_callCount++;
			calls.push(params);
			if (overrideError) {
				return Effect.fail(new ConversanalyzerError({ message: overrideError }));
			}
			return Effect.succeed(overrideOutput ?? defaultOutput);
		},
		analyzeLenient: (params: ConversanalyzerInput) => {
			_callCount++;
			calls.push(params);
			if (overrideError) {
				return Effect.fail(new ConversanalyzerError({ message: overrideError }));
			}
			return Effect.succeed(overrideOutput ?? defaultOutput);
		},
	}),
);
