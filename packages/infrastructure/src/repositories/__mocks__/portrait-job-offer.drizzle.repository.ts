/**
 * Mock: portrait-job-offer.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/portrait-job-offer.drizzle.repository')
 */

import { PortraitJobOfferRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

type OfferKey = `${string}:${string}`;
const offers = new Set<OfferKey>();

const makeKey = (sessionId: string, jobKey: string): OfferKey => `${sessionId}:${jobKey}`;

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => {
	offers.clear();
};

export const PortraitJobOfferDrizzleRepositoryLive = Layer.succeed(
	PortraitJobOfferRepository,
	PortraitJobOfferRepository.of({
		claimOffer: (input) =>
			Effect.sync(() => {
				const key = makeKey(input.sessionId, input.jobKey);
				if (offers.has(key)) return false;
				offers.add(key);
				return true;
			}),

		deleteOffersByJobKeyPrefix: (sessionId, jobKeyPrefix) =>
			Effect.sync(() => {
				for (const key of offers) {
					if (!key.startsWith(`${sessionId}:`)) continue;
					const jobKey = key.slice(sessionId.length + 1);
					if (jobKey.startsWith(jobKeyPrefix)) {
						offers.delete(key);
					}
				}
			}),
	}),
);
