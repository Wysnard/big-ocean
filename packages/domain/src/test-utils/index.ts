/**
 * Test Utilities and Mocks
 *
 * Provides mock factories and helper functions for testing across the monorepo.
 * Used to standardize test setup and reduce boilerplate.
 */

import { Effect } from "effect";

/**
 * Mock Anthropic API Response
 *
 * Simulates Claude API responses for testing Nerin agent without API calls.
 */
export const mockAnthropicResponse = (
	content: string,
	usage = { input_tokens: 100, output_tokens: 50 },
) => ({
	id: `msg_${Math.random().toString(36).substring(7)}`,
	type: "message" as const,
	role: "assistant" as const,
	content: [{ type: "text" as const, text: content }],
	model: "claude-3-5-sonnet-20241022",
	stop_reason: "end_turn" as const,
	usage,
});

/**
 * Mock Session Factory
 *
 * Creates test session objects with sensible defaults.
 */
export interface TestSession {
	id: string;
	userId?: string;
	createdAt: Date;
	precision: {
		openness: number;
		conscientiousness: number;
		extraversion: number;
		agreeableness: number;
		neuroticism: number;
	};
}

export const createTestSession = (overrides?: Partial<TestSession>): TestSession => ({
	id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
	userId: undefined,
	createdAt: new Date(),
	precision: {
		openness: 0.5,
		conscientiousness: 0.5,
		extraversion: 0.5,
		agreeableness: 0.5,
		neuroticism: 0.5,
	},
	...overrides,
});

/**
 * Mock Nerin Agent
 *
 * Simulates conversational agent responses for testing.
 */
export const mockNerin = (userMessage: string): Effect.Effect<string, never, never> =>
	Effect.succeed(`Thank you for sharing "${userMessage}". How does that make you feel?`);

/**
 * Mock Analyzer Agent
 *
 * Simulates pattern extraction from conversation.
 */
export interface AnalysisResult {
	patterns: string[];
	contradictions: string[];
	confidence: number;
}

export const mockAnalyzer = (_messages: string[]): Effect.Effect<AnalysisResult, never, never> =>
	Effect.succeed({
		patterns: ["openness to experience", "conscientiousness"],
		contradictions: [],
		confidence: 0.75,
	});

/**
 * Mock Scorer Agent
 *
 * Simulates trait scoring based on conversation.
 */
export const mockScorer = (): Effect.Effect<TestSession["precision"], never, never> =>
	Effect.succeed({
		openness: 0.6 + Math.random() * 0.2,
		conscientiousness: 0.5 + Math.random() * 0.2,
		extraversion: 0.4 + Math.random() * 0.2,
		agreeableness: 0.7 + Math.random() * 0.2,
		neuroticism: 0.3 + Math.random() * 0.2,
	});

/**
 * Mock Database Connection
 *
 * Provides in-memory database mock for testing without PostgreSQL.
 */
export const mockDatabase = () => {
	const sessions: Map<string, TestSession> = new Map();

	return {
		sessions: {
			insert: (session: TestSession) => Effect.sync(() => sessions.set(session.id, session)),
			findById: (id: string) => Effect.sync(() => sessions.get(id)),
			findByUserId: (userId: string) =>
				Effect.sync(() => Array.from(sessions.values()).filter((s) => s.userId === userId)),
			delete: (id: string) => Effect.sync(() => sessions.delete(id)),
		},
	};
};

/**
 * Mock Cost Guard
 *
 * Simulates LLM cost tracking without actual API calls.
 */
export interface CostGuard {
	trackUsage: (tokens: { input: number; output: number }) => Effect.Effect<void, never, never>;
	getRemainingBudget: () => Effect.Effect<number, never, never>;
}

export const mockCostGuard = (): CostGuard => {
	let remaining = 75.0; // $75 daily budget

	return {
		trackUsage: ({ input, output }) =>
			Effect.sync(() => {
				const cost = input * 0.000003 + output * 0.000015; // Approximate Claude pricing
				remaining -= cost;
			}),
		getRemainingBudget: () => Effect.succeed(remaining),
	};
};

/**
 * Mock Rate Limiter
 *
 * Simulates rate limiting without actual timing logic.
 */
export interface RateLimiter {
	checkLimit: (key: string) => Effect.Effect<boolean, never, never>;
	recordRequest: (key: string) => Effect.Effect<void, never, never>;
}

export const mockRateLimiter = (): RateLimiter => {
	const requests: Map<string, number> = new Map();

	return {
		checkLimit: (key) => Effect.succeed((requests.get(key) || 0) < 100), // Max 100 requests per key
		recordRequest: (key) =>
			Effect.sync(() => {
				requests.set(key, (requests.get(key) || 0) + 1);
			}),
	};
};
