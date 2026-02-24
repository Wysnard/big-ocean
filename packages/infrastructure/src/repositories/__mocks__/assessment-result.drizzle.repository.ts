/**
 * Mock: assessment-result.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/assessment-result.drizzle.repository')
 *
 * In-memory Map storage for assessment results.
 * Story 11.2
 */
import type {
	AssessmentResultInput,
	AssessmentResultRecord,
	AssessmentResultUpdateInput,
} from "@workspace/domain";
import { AssessmentResultError, AssessmentResultRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const storedResults = new Map<string, AssessmentResultRecord>();

export const _resetMockState = () => {
	storedResults.clear();
};

export const _getStoredResults = () => new Map(storedResults);

export const _seedResult = (
	sessionId: string,
	overrides?: Partial<AssessmentResultRecord>,
): AssessmentResultRecord => {
	const record: AssessmentResultRecord = {
		id: overrides?.id ?? `ar-${crypto.randomUUID()}`,
		assessmentSessionId: sessionId,
		facets: overrides?.facets ?? ({} as AssessmentResultRecord["facets"]),
		traits: overrides?.traits ?? ({} as AssessmentResultRecord["traits"]),
		domainCoverage: overrides?.domainCoverage ?? ({} as AssessmentResultRecord["domainCoverage"]),
		portrait: overrides?.portrait ?? "",
		createdAt: overrides?.createdAt ?? new Date(),
	};
	storedResults.set(sessionId, record);
	return record;
};

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

		update: (id: string, input: AssessmentResultUpdateInput) => {
			// Find by id (stored by sessionId, so search values)
			for (const [key, record] of storedResults) {
				if (record.id === id) {
					const updated: AssessmentResultRecord = { ...record, ...input };
					storedResults.set(key, updated);
					return Effect.succeed(updated);
				}
			}
			return Effect.fail(new AssessmentResultError({ message: `Assessment result not found: ${id}` }));
		},
	}),
);
