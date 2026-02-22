/**
 * Facet Evidence No-op Repository (Story 9.1)
 *
 * Temporary stub — the facet_evidence table was dropped in the clean-slate migration.
 * The old orchestrator code still depends on FacetEvidenceRepository interface.
 * This will be removed when Epic 10 replaces the orchestrator with the two-tier architecture.
 */

import { FacetEvidenceRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

export const FacetEvidenceNoopRepositoryLive = Layer.succeed(
	FacetEvidenceRepository,
	FacetEvidenceRepository.of({
		saveEvidence: () => Effect.succeed([]),
		getEvidenceByMessage: () => Effect.succeed([]),
		getEvidenceByFacet: () => Effect.succeed([]),
		getEvidenceBySession: () => Effect.succeed([]),
	}),
);
