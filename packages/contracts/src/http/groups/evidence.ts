/**
 * Evidence HTTP API Group
 *
 * Defines endpoints for retrieving facet evidence:
 * - getEvidenceByFacet: Fetch all evidence for a specific facet (Profile → Evidence panel)
 * - getEvidenceByMessage: Fetch all facets detected in a message (Message → Facets panel)
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError, SessionNotFound } from "../../errors";
import { SavedFacetEvidenceSchema } from "../../schemas/evidence";

/**
 * Get Evidence by Facet Request (URL params)
 */
export const GetEvidenceByFacetRequestSchema = S.Struct({
	sessionId: S.String,
	facetName: S.String,
});

/**
 * Get Evidence by Message Request (Path params)
 */
export const GetEvidenceByMessageRequestSchema = S.Struct({
	assessmentMessageId: S.String,
});

/**
 * Evidence API Group
 *
 * Routes:
 * - GET /api/evidence/facet?sessionId=xxx&facetName=xxx - Get evidence for a specific facet
 * - GET /api/evidence/message/:messageId - Get all facets detected in a message
 */
export const EvidenceGroup = HttpApiGroup.make("evidence")
	.add(
		HttpApiEndpoint.get("getEvidenceByFacet", "/facet")
			.setUrlParams(GetEvidenceByFacetRequestSchema)
			.addSuccess(S.Array(SavedFacetEvidenceSchema))
			.addError(SessionNotFound, { status: 404 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getEvidenceByMessage", "/message/:assessmentMessageId")
			.setPath(S.Struct({ assessmentMessageId: S.String }))
			.addSuccess(S.Array(SavedFacetEvidenceSchema))
			.addError(DatabaseError, { status: 500 }),
	)
	.prefix("/evidence");

// Export TypeScript types for frontend use
export type GetEvidenceByFacetRequest = typeof GetEvidenceByFacetRequestSchema.Type;
export type GetEvidenceByMessageRequest = typeof GetEvidenceByMessageRequestSchema.Type;
