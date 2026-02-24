/**
 * Mock: finalization-evidence.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/finalization-evidence.drizzle.repository')
 *
 * In-memory array storage for finalization evidence.
 * Story 11.2
 */
import type { FinalizationEvidenceInput, FinalizationEvidenceRecord } from "@workspace/domain";
import { FinalizationEvidenceRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const storedEvidence: (FinalizationEvidenceRecord & { _sessionId?: string })[] = [];
let existsOverride: boolean | null = null;
/** Map assessmentResultId → sessionId for existsForSession lookups */
const resultToSession = new Map<string, string>();

export const _resetMockState = () => {
	storedEvidence.length = 0;
	existsOverride = null;
	resultToSession.clear();
};

/** Link a resultId to a sessionId so existsForSession can resolve correctly */
export const _linkResultToSession = (resultId: string, sessionId: string) => {
	resultToSession.set(resultId, sessionId);
};

export const _getStoredEvidence = () => [...storedEvidence];

export const _setExistsOverride = (value: boolean) => {
	existsOverride = value;
};

export const _seedEvidence = (records: FinalizationEvidenceRecord[]) => {
	for (const r of records) {
		storedEvidence.push(r);
	}
};

export const FinalizationEvidenceDrizzleRepositoryLive = Layer.succeed(
	FinalizationEvidenceRepository,
	FinalizationEvidenceRepository.of({
		saveBatch: (records: readonly FinalizationEvidenceInput[]) => {
			for (const r of records) {
				storedEvidence.push({
					...r,
					id: `fe-${crypto.randomUUID()}`,
					createdAt: new Date(),
				});
			}
			return Effect.void;
		},

		getByResultId: (assessmentResultId: string) => {
			const filtered = storedEvidence.filter((e) => e.assessmentResultId === assessmentResultId);
			return Effect.succeed(filtered);
		},

		existsForSession: (sessionId: string) => {
			if (existsOverride !== null) {
				return Effect.succeed(existsOverride);
			}
			// Mimic real implementation: check if evidence exists for this specific session
			const hasEvidence = storedEvidence.some((e) => {
				const linkedSession = resultToSession.get(e.assessmentResultId);
				return linkedSession === sessionId;
			});
			return Effect.succeed(hasEvidence);
		},
	}),
);
