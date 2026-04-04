/**
 * Mock: conversanalyzer.anthropic.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/conversanalyzer.anthropic.repository')
 *
 * Returns deterministic evidence extraction output.
 * Story 10.2 (v1), Story 24-1 (v2 evolution), Story 42-2 (split calls), Story 43-6 (strip user-state)
 */
import {
	ConversanalyzerError,
	type ConversanalyzerEvidenceOutput,
	type ConversanalyzerInput,
	ConversanalyzerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

let _callCount = 0;
const calls: ConversanalyzerInput[] = [];

/** Clear in-memory state between tests */
export const _resetMockState = () => {
	_callCount = 0;
	calls.length = 0;
	overrideEvidenceOutput = null;
	overrideError = null;
	overrideEvidenceError = null;
};

/** Read-only access for test assertions */
export const _getMockCalls = () => [...calls];

const defaultEvidence = [
	{
		bigfiveFacet: "imagination" as const,
		deviation: 1,
		polarity: "high" as const,
		strength: "moderate" as const,
		confidence: "medium" as const,
		domain: "work" as const,
		note: "Shows creative thinking in professional context",
	},
	{
		bigfiveFacet: "trust" as const,
		deviation: 1,
		polarity: "high" as const,
		strength: "weak" as const,
		confidence: "medium" as const,
		domain: "relationships" as const,
		note: "Indicates baseline trust in social interactions",
	},
];

/** Override the mock evidence output for specific tests */
let overrideEvidenceOutput: ConversanalyzerEvidenceOutput | null = null;
let overrideError: string | null = null;
let overrideEvidenceError: string | null = null;

export const _setMockEvidenceOutput = (output: ConversanalyzerEvidenceOutput) => {
	overrideEvidenceOutput = output;
};

export const _setMockError = (message: string) => {
	overrideError = message;
};

export const _setMockEvidenceError = (message: string) => {
	overrideEvidenceError = message;
};

export const ConversanalyzerAnthropicRepositoryLive = Layer.succeed(
	ConversanalyzerRepository,
	ConversanalyzerRepository.of({
		analyzeEvidence: (params: ConversanalyzerInput) => {
			_callCount++;
			calls.push(params);
			if (overrideEvidenceError || overrideError) {
				return Effect.fail(
					new ConversanalyzerError({ message: overrideEvidenceError ?? overrideError ?? "" }),
				);
			}
			const output: ConversanalyzerEvidenceOutput = {
				evidence: overrideEvidenceOutput?.evidence ?? defaultEvidence,
				tokenUsage: overrideEvidenceOutput?.tokenUsage ?? { input: 0, output: 0 },
			};
			return Effect.succeed(output);
		},
		analyzeEvidenceLenient: (params: ConversanalyzerInput) => {
			_callCount++;
			calls.push(params);
			if (overrideEvidenceError || overrideError) {
				return Effect.fail(
					new ConversanalyzerError({ message: overrideEvidenceError ?? overrideError ?? "" }),
				);
			}
			const output: ConversanalyzerEvidenceOutput = {
				evidence: overrideEvidenceOutput?.evidence ?? defaultEvidence,
				tokenUsage: overrideEvidenceOutput?.tokenUsage ?? { input: 0, output: 0 },
			};
			return Effect.succeed(output);
		},
	}),
);
