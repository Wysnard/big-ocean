/**
 * Mock: cost-guard.redis.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/cost-guard.redis.repository')
 *
 * In-memory CostGuard implementation for testing.
 */
import { GlobalAssessmentLimitReached, RateLimitExceeded } from "@workspace/contracts";
import { CostGuardRepository, getNextDayMidnightUTC, getUTCDateKey } from "@workspace/domain";
import { DateTime, Effect, Layer } from "effect";

const DAILY_ASSESSMENT_LIMIT = 1;

const GLOBAL_DAILY_ASSESSMENT_LIMIT = 100;

const costs = new Map<string, number>();
const assessments = new Map<string, number>();
let globalAssessmentCount = 0;

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => {
	costs.clear();
	assessments.clear();
	globalAssessmentCount = 0;
};

export const CostGuardRedisRepositoryLive = Layer.succeed(
	CostGuardRepository,
	CostGuardRepository.of({
		incrementDailyCost: (userId: string, costCents: number) =>
			Effect.sync(() => {
				const key = `cost:${userId}:${getUTCDateKey()}`;
				const current = costs.get(key) || 0;
				const newValue = current + costCents;
				costs.set(key, newValue);
				return newValue;
			}),

		getDailyCost: (userId: string) =>
			Effect.sync(() => {
				const key = `cost:${userId}:${getUTCDateKey()}`;
				return costs.get(key) || 0;
			}),

		incrementAssessmentCount: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${getUTCDateKey()}`;
				const current = assessments.get(key) || 0;
				const newValue = current + 1;
				assessments.set(key, newValue);
				return newValue;
			}),

		getAssessmentCount: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${getUTCDateKey()}`;
				return assessments.get(key) || 0;
			}),

		canStartAssessment: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${getUTCDateKey()}`;
				const count = assessments.get(key) || 0;
				return count < DAILY_ASSESSMENT_LIMIT;
			}),

		recordAssessmentStart: (userId: string) =>
			Effect.gen(function* () {
				const key = `assessments:${userId}:${getUTCDateKey()}`;
				const current = assessments.get(key) || 0;
				const newCount = current + 1;
				assessments.set(key, newCount);

				if (newCount > DAILY_ASSESSMENT_LIMIT) {
					return yield* Effect.fail(
						new RateLimitExceeded({
							userId,
							message: "You can start a new assessment tomorrow",
							resetAt: DateTime.unsafeMake(getNextDayMidnightUTC().getTime()),
						}),
					);
				}
			}),

		checkDailyBudget: (_key: string, _limitCents: number) => Effect.void,

		checkMessageRateLimit: (_key: string) => Effect.void,

		checkAndRecordGlobalAssessmentStart: () =>
			Effect.gen(function* () {
				globalAssessmentCount += 1;
				if (globalAssessmentCount > GLOBAL_DAILY_ASSESSMENT_LIMIT) {
					globalAssessmentCount -= 1;
					return yield* Effect.fail(
						new GlobalAssessmentLimitReached({
							message: "We've reached our daily assessment limit. Please try again tomorrow!",
							resumeAfter: DateTime.unsafeFromDate(getNextDayMidnightUTC()),
						}),
					);
				}
			}),
	}),
);
