/**
 * Mock: assessment-result.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/assessment-result.drizzle.repository')
 *
 * In-memory Map storage for assessment results.
 * Story 11.2, 18-4
 */
import type {
	AssessmentResultInput,
	AssessmentResultRecord,
	AssessmentResultUpdateInput,
	ResultStage,
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
		stage: overrides?.stage ?? null,
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
				stage: input.stage ?? null,
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
			for (const [key, record] of storedResults) {
				if (record.id === id) {
					const updated: AssessmentResultRecord = { ...record, ...input };
					storedResults.set(key, updated);
					return Effect.succeed(updated);
				}
			}
			return Effect.fail(new AssessmentResultError({ message: `Assessment result not found: ${id}` }));
		},

		upsert: (input: AssessmentResultInput) => {
			const existing = storedResults.get(input.assessmentSessionId);
			if (existing) {
				const updated: AssessmentResultRecord = {
					...existing,
					facets: input.facets,
					traits: input.traits,
					domainCoverage: input.domainCoverage,
					portrait: input.portrait,
					stage: input.stage ?? null,
				};
				storedResults.set(input.assessmentSessionId, updated);
				return Effect.succeed(updated);
			}
			const record: AssessmentResultRecord = {
				...input,
				id: `ar-${crypto.randomUUID()}`,
				stage: input.stage ?? null,
				createdAt: new Date(),
			};
			storedResults.set(input.assessmentSessionId, record);
			return Effect.succeed(record);
		},

		getLatestByUserId: (_userId: string) => {
			// Find the most recent completed result by iterating all stored results
			// Mock needs session → userId mapping; we look at sessionId patterns
			// In tests, callers should use _seedResult with appropriate session IDs
			let latest: AssessmentResultRecord | null = null;
			for (const record of storedResults.values()) {
				if (record.stage === "completed") {
					if (!latest || record.createdAt > latest.createdAt) {
						latest = record;
					}
				}
			}
			return Effect.succeed(latest);
		},

		updateStage: (sessionId: string, stage: ResultStage) => {
			const record = storedResults.get(sessionId);
			if (!record) {
				return Effect.fail(
					new AssessmentResultError({
						message: `Assessment result not found for session: ${sessionId}`,
					}),
				);
			}
			const updated: AssessmentResultRecord = { ...record, stage };
			storedResults.set(sessionId, updated);
			return Effect.succeed(updated);
		},
	}),
);
