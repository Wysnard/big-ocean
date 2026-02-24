/**
 * Mock: portrait.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/portrait.drizzle.repository')
 */

import type { InsertPortraitPlaceholder, Portrait, PortraitTier } from "@workspace/domain";
import {
	DuplicatePortraitError,
	PortraitNotFoundError,
	PortraitRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

// In-memory storage: Map<id, Portrait>
const portraitStore = new Map<string, Portrait>();

// Secondary index: Map<"resultId:tier", Portrait> for unique constraint
const resultTierIndex = new Map<string, Portrait>();

// Session-to-result mapping: Map<sessionId, assessmentResultId>
// Tests need to set this up via _setSessionResultMapping
const sessionResultMapping = new Map<string, string>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => {
	portraitStore.clear();
	resultTierIndex.clear();
	sessionResultMapping.clear();
};

/** Set up session-to-result mapping for getFullPortraitBySessionId tests */
export const _setSessionResultMapping = (sessionId: string, assessmentResultId: string) => {
	sessionResultMapping.set(sessionId, assessmentResultId);
};

/** Get stored portrait by ID (for test assertions) */
export const _getPortraitById = (id: string): Portrait | undefined => portraitStore.get(id);

const makeIndexKey = (assessmentResultId: string, tier: PortraitTier): string =>
	`${assessmentResultId}:${tier}`;

export const PortraitDrizzleRepositoryLive = Layer.succeed(
	PortraitRepository,
	PortraitRepository.of({
		insertPlaceholder: (data: InsertPortraitPlaceholder) =>
			Effect.gen(function* () {
				const indexKey = makeIndexKey(data.assessmentResultId, data.tier);

				// Check unique constraint
				if (resultTierIndex.has(indexKey)) {
					return yield* Effect.fail(
						new DuplicatePortraitError({
							assessmentResultId: data.assessmentResultId,
							tier: data.tier,
						}),
					);
				}

				const portrait: Portrait = {
					id: crypto.randomUUID(),
					assessmentResultId: data.assessmentResultId,
					tier: data.tier,
					content: null, // Placeholder — generating
					lockedSectionTitles: null,
					modelUsed: data.modelUsed,
					retryCount: 0,
					createdAt: new Date(),
				};

				portraitStore.set(portrait.id, portrait);
				resultTierIndex.set(indexKey, portrait);

				return portrait;
			}),

		updateContent: (id: string, content: string) =>
			Effect.gen(function* () {
				const existing = portraitStore.get(id);

				// Check: exists AND content IS NULL (idempotent update)
				if (!existing || existing.content !== null) {
					return yield* Effect.fail(new PortraitNotFoundError({ portraitId: id }));
				}

				const updated: Portrait = {
					...existing,
					content,
				};

				portraitStore.set(id, updated);
				const indexKey = makeIndexKey(existing.assessmentResultId, existing.tier);
				resultTierIndex.set(indexKey, updated);

				return updated;
			}),

		incrementRetryCount: (id: string) =>
			Effect.gen(function* () {
				const existing = portraitStore.get(id);

				if (!existing) {
					return yield* Effect.fail(new PortraitNotFoundError({ portraitId: id }));
				}

				const updated: Portrait = {
					...existing,
					retryCount: existing.retryCount + 1,
				};

				portraitStore.set(id, updated);
				const indexKey = makeIndexKey(existing.assessmentResultId, existing.tier);
				resultTierIndex.set(indexKey, updated);

				return updated;
			}),

		getByResultIdAndTier: (assessmentResultId: string, tier: PortraitTier) =>
			Effect.sync(() => {
				const indexKey = makeIndexKey(assessmentResultId, tier);
				return resultTierIndex.get(indexKey) ?? null;
			}),

		getFullPortraitBySessionId: (sessionId: string) =>
			Effect.sync(() => {
				// Lookup assessment_result_id via session mapping
				const assessmentResultId = sessionResultMapping.get(sessionId);
				if (!assessmentResultId) {
					return null;
				}

				const indexKey = makeIndexKey(assessmentResultId, "full");
				return resultTierIndex.get(indexKey) ?? null;
			}),
	}),
);
