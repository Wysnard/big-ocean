/**
 * Mock: conversanalyzer.anthropic.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/conversanalyzer.anthropic.repository')
 *
 * Returns deterministic output with userState + evidence.
 * Story 10.2 (v1), Story 24-1 (v2 evolution), Story 42-2 (split calls)
 */
import {
	ConversanalyzerError,
	type ConversanalyzerEvidenceOutput,
	type ConversanalyzerInput,
	ConversanalyzerRepository,
	type ConversanalyzerUserStateOutput,
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
	overrideUserStateError = null;
	overrideEvidenceError = null;
};

/** Read-only access for test assertions */
export const _getMockCalls = () => [...calls];

const defaultUserState = {
	energyBand: "steady" as const,
	tellingBand: "mixed" as const,
	energyReason: "Engaged with moderate self-reflection",
	tellingReason: "Follows prompts with some self-direction",
	withinMessageShift: false,
};

const defaultEvidence = [
	{
		bigfiveFacet: "imagination" as const,
		deviation: 1,
		strength: "moderate" as const,
		confidence: "medium" as const,
		domain: "work" as const,
		note: "Shows creative thinking in professional context",
	},
	{
		bigfiveFacet: "trust" as const,
		deviation: 1,
		strength: "weak" as const,
		confidence: "medium" as const,
		domain: "relationships" as const,
		note: "Indicates baseline trust in social interactions",
	},
];

/** Override the mock output for specific tests */
let overrideOutput: ConversanalyzerV2Output | null = null;
let overrideError: string | null = null;
let overrideUserStateError: string | null = null;
let overrideEvidenceError: string | null = null;

export const _setMockOutput = (output: ConversanalyzerV2Output) => {
	overrideOutput = output;
};

export const _setMockError = (message: string) => {
	overrideError = message;
};

export const _setMockUserStateError = (message: string) => {
	overrideUserStateError = message;
};

export const _setMockEvidenceError = (message: string) => {
	overrideEvidenceError = message;
};

export const ConversanalyzerAnthropicRepositoryLive = Layer.succeed(
	ConversanalyzerRepository,
	ConversanalyzerRepository.of({
		analyzeUserState: (params: ConversanalyzerInput) => {
			_callCount++;
			calls.push(params);
			if (overrideUserStateError || overrideError) {
				return Effect.fail(
					new ConversanalyzerError({ message: overrideUserStateError ?? overrideError ?? "" }),
				);
			}
			const output: ConversanalyzerUserStateOutput = {
				userState: overrideOutput?.userState ?? defaultUserState,
				tokenUsage: overrideOutput?.tokenUsage ?? { input: 0, output: 0 },
			};
			return Effect.succeed(output);
		},
		analyzeUserStateLenient: (params: ConversanalyzerInput) => {
			_callCount++;
			calls.push(params);
			if (overrideUserStateError || overrideError) {
				return Effect.fail(
					new ConversanalyzerError({ message: overrideUserStateError ?? overrideError ?? "" }),
				);
			}
			const output: ConversanalyzerUserStateOutput = {
				userState: overrideOutput?.userState ?? defaultUserState,
				tokenUsage: overrideOutput?.tokenUsage ?? { input: 0, output: 0 },
			};
			return Effect.succeed(output);
		},
		analyzeEvidence: (params: ConversanalyzerInput) => {
			_callCount++;
			calls.push(params);
			if (overrideEvidenceError || overrideError) {
				return Effect.fail(
					new ConversanalyzerError({ message: overrideEvidenceError ?? overrideError ?? "" }),
				);
			}
			const output: ConversanalyzerEvidenceOutput = {
				evidence: overrideOutput?.evidence ?? defaultEvidence,
				tokenUsage: overrideOutput?.tokenUsage ?? { input: 0, output: 0 },
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
				evidence: overrideOutput?.evidence ?? defaultEvidence,
				tokenUsage: overrideOutput?.tokenUsage ?? { input: 0, output: 0 },
			};
			return Effect.succeed(output);
		},
	}),
);
