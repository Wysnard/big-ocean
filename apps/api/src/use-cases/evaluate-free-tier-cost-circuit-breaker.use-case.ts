/**
 * Free-tier weekly-letter cost circuit breaker (Story 11-1, ADR-50).
 *
 * Compares rolling 24h free-tier weekly-summary LLM spend to a coarse threshold;
 * toggles Redis `free_tier_llm_paused` with hysteresis. Intended for cron (~15m).
 */

import { createHash, timingSafeEqual } from "node:crypto";
import {
	AppConfig,
	CostGuardRepository,
	DatabaseError,
	isEntitledTo,
	LoggerRepository,
	type PurchaseEvent,
	PurchaseEventRepository,
	Unauthorized,
	WeeklySummaryRepository,
} from "@workspace/domain";
import { Effect, Redacted } from "effect";

const constantTimeSecretEqual = (a: string, b: string): boolean => {
	const ha = createHash("sha256").update(a, "utf8").digest();
	const hb = createHash("sha256").update(b, "utf8").digest();
	return timingSafeEqual(ha, hb);
};

export interface EvaluateFreeTierCostCircuitBreakerInput {
	readonly cronSecretHeader?: string | undefined;
}

export interface EvaluateFreeTierCostCircuitBreakerOutput {
	readonly actualCost24hCents: number;
	readonly thresholdCents: number;
	readonly freeTierLlmPaused: boolean;
}

export const evaluateFreeTierCostCircuitBreaker = (
	input: EvaluateFreeTierCostCircuitBreakerInput,
): Effect.Effect<
	EvaluateFreeTierCostCircuitBreakerOutput,
	Unauthorized | DatabaseError,
	| AppConfig
	| WeeklySummaryRepository
	| PurchaseEventRepository
	| CostGuardRepository
	| LoggerRepository
> =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const configuredCron = Redacted.value(config.cronSecret);
		if (configuredCron.length > 0) {
			const header = input.cronSecretHeader ?? "";
			if (!constantTimeSecretEqual(header, configuredCron)) {
				return yield* Effect.fail(new Unauthorized({ message: "Invalid or missing x-cron-secret" }));
			}
		}

		const weeklyRepo = yield* WeeklySummaryRepository;
		const purchaseRepo = yield* PurchaseEventRepository;
		const costGuard = yield* CostGuardRepository;
		const logger = yield* LoggerRepository;

		const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const rows = yield* weeklyRepo.listGeneratedCostsSince(since);

		const eventsCache = new Map<string, PurchaseEvent[]>();

		const getEventsCached = (userId: string) =>
			Effect.gen(function* () {
				const hit = eventsCache.get(userId);
				if (hit) return hit;
				const ev = yield* purchaseRepo.getEventsByUserId(userId);
				eventsCache.set(userId, ev);
				return ev;
			});

		let actualCost24hCents = 0;
		for (const row of rows) {
			const events = yield* getEventsCached(row.userId);
			if (!isEntitledTo(events, "conversation_extension")) {
				actualCost24hCents += row.llmCostCents;
			}
		}

		const expectedDailyCents = Math.max(
			1,
			Math.ceil((config.costCeilingActiveUsersEstimate * config.weeklyLetterExpectedCostCents) / 7),
		);
		const thresholdCents = Math.max(1, config.costCircuitBreakerMultiplier * expectedDailyCents);

		const pausedNow = yield* costGuard.getFreeTierLlmPaused().pipe(
			Effect.catchTag("RedisOperationError", (err) =>
				Effect.sync(() => {
					logger.warn("Redis unavailable reading free_tier_llm_paused — fail-open", {
						message: err.message,
					});
					return false;
				}),
			),
		);

		if (actualCost24hCents > thresholdCents) {
			if (!pausedNow) {
				const setPauseSucceeded = yield* costGuard.setFreeTierLlmPaused(true).pipe(
					Effect.map(() => true),
					Effect.catchTag("RedisOperationError", (err) =>
						Effect.sync(() => {
							logger.error("Failed to set free_tier_llm_paused (fail-open)", {
								message: err.message,
							});
							return false;
						}),
					),
				);
				if (setPauseSucceeded) {
					logger.warn("cost_circuit_breaker_tripped", {
						event: "cost_circuit_breaker_tripped",
						thresholdCents,
						actualCost24hCents,
						windowStart: since.toISOString(),
						windowEnd: new Date().toISOString(),
					});
				}
			}
		} else if (pausedNow && actualCost24hCents < thresholdCents * 0.8) {
			const clearPauseSucceeded = yield* costGuard.setFreeTierLlmPaused(false).pipe(
				Effect.map(() => true),
				Effect.catchTag("RedisOperationError", (err) =>
					Effect.sync(() => {
						logger.error("Failed to clear free_tier_llm_paused (fail-open)", {
							message: err.message,
						});
						return false;
					}),
				),
			);
			if (clearPauseSucceeded) {
				logger.info("cost_circuit_breaker_cleared", {
					event: "cost_circuit_breaker_cleared",
					thresholdCents,
					actualCost24hCents,
				});
			}
		}

		const pausedAfter = yield* costGuard
			.getFreeTierLlmPaused()
			.pipe(Effect.catchTag("RedisOperationError", () => Effect.succeed(false)));

		return {
			actualCost24hCents,
			thresholdCents,
			freeTierLlmPaused: pausedAfter,
		};
	});
