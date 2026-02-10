/**
 * Evidence Presenters (HTTP Handlers)
 *
 * Thin presenter layer that connects HTTP requests to evidence retrieval use cases.
 * Handles HTTP request/response transformation only.
 * Business logic lives in use cases.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi, DatabaseError } from "@workspace/contracts";
import { ALL_FACETS, type FacetName } from "@workspace/domain";
import { Effect } from "effect";
import { getFacetEvidence, getMessageEvidence } from "../use-cases/index";

export const EvidenceGroupLive = HttpApiBuilder.group(BigOceanApi, "evidence", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("getEvidenceByFacet", ({ urlParams }) =>
				Effect.gen(function* () {
					const { sessionId, facetName } = urlParams;

					// Validate facetName is a valid FacetName
					if (!ALL_FACETS.includes(facetName as FacetName)) {
						return yield* Effect.fail(
							new DatabaseError({
								message: `Invalid facet name: ${facetName}. Must be one of: ${ALL_FACETS.join(", ")}`,
							}),
						);
					}

					const result = yield* getFacetEvidence({
						sessionId,
						facetName: facetName as FacetName,
					}).pipe(
						Effect.catchTag("FacetEvidencePersistenceError", (error) =>
							Effect.fail(
								new DatabaseError({
									message: `Failed to fetch facet evidence: ${error.message}`,
								}),
							),
						),
					);

					return result;
				}),
			)
			.handle("getEvidenceByMessage", ({ path }) =>
				Effect.gen(function* () {
					const { assessmentMessageId } = path;

					const result = yield* getMessageEvidence({
						assessmentMessageId,
					}).pipe(
						Effect.catchTag("FacetEvidencePersistenceError", (error) =>
							Effect.fail(
								new DatabaseError({
									message: `Failed to fetch message evidence: ${error.message}`,
								}),
							),
						),
					);

					return result;
				}),
			);
	}),
);
