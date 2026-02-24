/**
 * Mock: finanalyzer.anthropic.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/finanalyzer.anthropic.repository')
 *
 * Returns deterministic evidence for a standard conversation.
 * Story 11.2
 */

import type { FinanalyzerMessage } from "@workspace/domain";
import { FinanalyzerError, type FinanalyzerOutput, FinanalyzerRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

let _callCount = 0;
const calls: Array<{ messages: readonly FinanalyzerMessage[] }> = [];

let overrideOutput: FinanalyzerOutput | null = null;
let overrideError: string | null = null;
/** Number of calls that should fail before succeeding (for retry testing) */
let failForCallCount = 0;

export const _resetMockState = () => {
	_callCount = 0;
	calls.length = 0;
	overrideOutput = null;
	overrideError = null;
	failForCallCount = 0;
};

export const _getMockCalls = () => [...calls];

export const _setMockOutput = (output: FinanalyzerOutput) => {
	overrideOutput = output;
};

export const _setMockError = (message: string) => {
	overrideError = message;
};

/**
 * Set number of calls that should fail before succeeding.
 * Used to test retry behavior (e.g., _failForCalls(1) = first call fails, retry succeeds).
 */
export const _failForCalls = (count: number, errorMessage = "Transient error") => {
	failForCallCount = count;
	overrideError = errorMessage;
};

/** Default deterministic evidence — covers all 5 traits with varied domains */
const defaultOutput: FinanalyzerOutput = {
	evidence: [
		{
			messageId: "msg-1",
			bigfiveFacet: "imagination",
			score: 16,
			confidence: 0.8,
			domain: "work",
			rawDomain: "creative projects",
			quote: "I love brainstorming new ideas",
		},
		{
			messageId: "msg-1",
			bigfiveFacet: "intellect",
			score: 15,
			confidence: 0.7,
			domain: "solo",
			rawDomain: "personal reading",
			quote: "I spend hours reading about topics",
		},
		{
			messageId: "msg-2",
			bigfiveFacet: "orderliness",
			score: 8,
			confidence: 0.6,
			domain: "work",
			rawDomain: "project management",
			quote: "I prefer to keep things flexible",
		},
		{
			messageId: "msg-2",
			bigfiveFacet: "self_discipline",
			score: 12,
			confidence: 0.5,
			domain: "solo",
			rawDomain: "daily routines",
			quote: "I try to stick to my schedule",
		},
		{
			messageId: "msg-3",
			bigfiveFacet: "friendliness",
			score: 17,
			confidence: 0.9,
			domain: "relationships",
			rawDomain: "close friendships",
			quote: "I really value deep conversations",
		},
		{
			messageId: "msg-3",
			bigfiveFacet: "gregariousness",
			score: 14,
			confidence: 0.6,
			domain: "leisure",
			rawDomain: "social events",
			quote: "I enjoy group activities",
		},
		{
			messageId: "msg-4",
			bigfiveFacet: "trust",
			score: 13,
			confidence: 0.7,
			domain: "relationships",
			rawDomain: "romantic partner",
			quote: "I believe people are generally good",
		},
		{
			messageId: "msg-4",
			bigfiveFacet: "altruism",
			score: 16,
			confidence: 0.8,
			domain: "family",
			rawDomain: "helping parents",
			quote: "I always help my family when needed",
		},
		{
			messageId: "msg-5",
			bigfiveFacet: "anxiety",
			score: 11,
			confidence: 0.5,
			domain: "work",
			rawDomain: "deadlines",
			quote: "Sometimes I worry about deadlines",
		},
		{
			messageId: "msg-5",
			bigfiveFacet: "vulnerability",
			score: 9,
			confidence: 0.4,
			domain: "solo",
			rawDomain: "stress management",
			quote: "I handle pressure reasonably well",
		},
	],
	tokenUsage: { input: 5000, output: 2000 },
};

export const FinanalyzerAnthropicRepositoryLive = Layer.succeed(
	FinanalyzerRepository,
	FinanalyzerRepository.of({
		// NOTE: Side effects are deferred via Effect.sync so that retry actually re-executes them.
		// Without this, _callCount++ happens once when analyze() is called, not when Effect runs.
		analyze: (params: { readonly messages: readonly FinanalyzerMessage[] }) =>
			Effect.sync(() => {
				_callCount++;
				calls.push(params);
			}).pipe(
				Effect.flatMap(() => {
					// Support retry testing: fail for first N calls, then succeed
					if (failForCallCount > 0 && _callCount <= failForCallCount) {
						return Effect.fail(new FinanalyzerError({ message: overrideError ?? "Transient error" }));
					}
					// Permanent error mode (all calls fail)
					if (overrideError && failForCallCount === 0) {
						return Effect.fail(new FinanalyzerError({ message: overrideError }));
					}
					return Effect.succeed(overrideOutput ?? defaultOutput);
				}),
			),
	}),
);
