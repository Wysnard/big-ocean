/**
 * Mock: portrait.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/portrait.drizzle.repository')
 *
 * Queue-based architecture: insert on final outcome (success/failure), no placeholder.
 */

import type {
	InsertPortraitFailed,
	InsertPortraitWithContent,
	Portrait,
	PortraitTier,
} from "@workspace/domain";
import { PortraitRepository } from "@workspace/domain";
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

/** Get all stored portraits (for test assertions) */
export const _getAllPortraits = (): Portrait[] => [...portraitStore.values()];

const makeIndexKey = (assessmentResultId: string, tier: PortraitTier): string =>
	`${assessmentResultId}:${tier}`;

export const PortraitDrizzleRepositoryLive = Layer.succeed(
	PortraitRepository,
	PortraitRepository.of({
		insertWithContent: (data: InsertPortraitWithContent) =>
			Effect.sync(() => {
				const indexKey = makeIndexKey(data.assessmentResultId, data.tier);

				// ON CONFLICT DO NOTHING — return null if already exists
				if (resultTierIndex.has(indexKey)) {
					return null;
				}

				const portrait: Portrait = {
					id: crypto.randomUUID(),
					assessmentResultId: data.assessmentResultId,
					tier: data.tier,
					content: data.content,
					modelUsed: data.modelUsed,
					spineBrief: data.spineBrief,
					spineVerification: data.spineVerification,
					portraitPipelineModels: data.portraitPipelineModels,
					failedAt: null,
					createdAt: new Date(),
				};

				portraitStore.set(portrait.id, portrait);
				resultTierIndex.set(indexKey, portrait);

				return portrait;
			}),

		insertFailed: (data: InsertPortraitFailed) =>
			Effect.sync(() => {
				const indexKey = makeIndexKey(data.assessmentResultId, data.tier);

				// ON CONFLICT DO NOTHING — return null if already exists
				if (resultTierIndex.has(indexKey)) {
					return null;
				}

				const portrait: Portrait = {
					id: crypto.randomUUID(),
					assessmentResultId: data.assessmentResultId,
					tier: data.tier,
					content: null,
					modelUsed: null,
					spineBrief: null,
					spineVerification: null,
					portraitPipelineModels: null,
					failedAt: data.failedAt,
					createdAt: new Date(),
				};

				portraitStore.set(portrait.id, portrait);
				resultTierIndex.set(indexKey, portrait);

				return portrait;
			}),

		deleteByResultIdAndTier: (assessmentResultId: string, tier: PortraitTier) =>
			Effect.sync(() => {
				const indexKey = makeIndexKey(assessmentResultId, tier);
				const existing = resultTierIndex.get(indexKey);

				if (!existing) return false;

				portraitStore.delete(existing.id);
				resultTierIndex.delete(indexKey);
				return true;
			}),

		getByResultIdAndTier: (assessmentResultId: string, tier: PortraitTier) =>
			Effect.sync(() => {
				const indexKey = makeIndexKey(assessmentResultId, tier);
				return resultTierIndex.get(indexKey) ?? null;
			}),

		getFullPortraitBySessionId: (sessionId: string) =>
			Effect.sync(() => {
				const assessmentResultId = sessionResultMapping.get(sessionId);
				if (!assessmentResultId) {
					return null;
				}

				const indexKey = makeIndexKey(assessmentResultId, "full");
				return resultTierIndex.get(indexKey) ?? null;
			}),
	}),
);
