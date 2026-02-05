/**
 * Mock: facet-evidence.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/facet-evidence.drizzle.repository')
 */
import { FacetEvidenceRepository, type SavedFacetEvidence } from "@workspace/domain";
import { Effect, Layer } from "effect";

// In-memory store for saved evidence, keyed by assessmentMessageId
const evidenceStore = new Map<string, SavedFacetEvidence[]>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => evidenceStore.clear();

export const FacetEvidenceDrizzleRepositoryLive = Layer.succeed(FacetEvidenceRepository, {
	saveEvidence: (_assessmentMessageId, evidence) =>
		Effect.sync(() => {
			const saved = evidence.map((e, i) => ({
				...e,
				id: `evidence_${crypto.randomUUID().slice(0, 8)}_${i}`,
				createdAt: new Date(),
			}));
			// Store evidence by message ID
			const existing = evidenceStore.get(_assessmentMessageId) || [];
			evidenceStore.set(_assessmentMessageId, [...existing, ...saved]);
			return saved;
		}),

	getEvidenceByMessage: (assessmentMessageId) =>
		Effect.sync(() => evidenceStore.get(assessmentMessageId) || []),

	getEvidenceByFacet: () => Effect.succeed([]),

	getEvidenceBySession: () => Effect.succeed([]),
});
