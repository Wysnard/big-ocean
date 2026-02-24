/**
 * Mock: assessment-result.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/assessment-result.drizzle.repository')
 *
 * In-memory Map storage for assessment results.
 * Story 11.2
 */
import type { AssessmentResultInput, AssessmentResultRecord } from "@workspace/domain";
import { AssessmentResultRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const storedResults = new Map<string, AssessmentResultRecord>();

export const _resetMockState = () => {
	storedResults.clear();
};

export const _getStoredResults = () => new Map(storedResults);

export const AssessmentResultDrizzleRepositoryLive = Layer.succeed(
	AssessmentResultRepository,
	AssessmentResultRepository.of({
		create: (input: AssessmentResultInput) => {
			const record: AssessmentResultRecord = {
				...input,
				id: `ar-${crypto.randomUUID()}`,
				createdAt: new Date(),
			};
			storedResults.set(input.assessmentSessionId, record);
			return Effect.succeed(record);
		},

		getBySessionId: (sessionId: string) => {
			const result = storedResults.get(sessionId) ?? null;
			return Effect.succeed(result);
		},
	}),
);
