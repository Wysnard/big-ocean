/**
 * Mock: conversanalyzer.anthropic.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/conversanalyzer.anthropic.repository')
 *
 * Returns deterministic evidence balanced across domains/facets.
 * Story 10.2
 */
import {
	ConversanalyzerError,
	type ConversanalyzerInput,
	type ConversanalyzerOutput,
	ConversanalyzerRepository,
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

/** Default deterministic evidence — 2 balanced records, zero token usage */
const defaultOutput: ConversanalyzerOutput = {
	evidence: [
		{ bigfiveFacet: "imagination", score: 14, confidence: 0.6, domain: "work" },
		{ bigfiveFacet: "trust", score: 12, confidence: 0.5, domain: "relationships" },
	],
	tokenUsage: { input: 0, output: 0 },
};

/** Override the mock output for specific tests */
let overrideOutput: ConversanalyzerOutput | null = null;
let overrideError: string | null = null;

export const _setMockOutput = (output: ConversanalyzerOutput) => {
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
	}),
);
