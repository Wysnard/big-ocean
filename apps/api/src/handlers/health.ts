/**
 * Health Check Handler
 *
 * Simple health check endpoint implementation.
 * Pattern from: effect-worker-mono/apps/effect-worker-api/src/handlers/health.ts
 */

import { HttpApiBuilder, HttpMiddleware } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { AppConfig, CostGuardRepository, LoggerRepository } from "@workspace/domain";
import { DateTime, Effect } from "effect";

export const HealthGroupLive = HttpApiBuilder.group(BigOceanApi, "health", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("check", () =>
				HttpMiddleware.withLoggerDisabled(
					Effect.succeed({
						status: "ok" as const,
						timestamp: DateTime.unsafeMake(Date.now()),
					}),
				),
			)
			.handle("costGuard", () =>
				HttpMiddleware.withLoggerDisabled(
					Effect.gen(function* () {
						const costGuard = yield* CostGuardRepository;
						const config = yield* AppConfig;
						const logger = yield* LoggerRepository;
						const freeTierLlmPaused = yield* costGuard.getFreeTierLlmPaused().pipe(
							Effect.catchTag("RedisOperationError", (err) =>
								Effect.sync(() => {
									logger.warn("health/cost-guard: Redis unavailable, reporting not paused", {
										message: err.message,
									});
									return false;
								}),
							),
						);
						return {
							freeTierLlmPaused,
							weeklyLetterExpectedCostCents: config.weeklyLetterExpectedCostCents,
							costCeilingActiveUsersEstimate: config.costCeilingActiveUsersEstimate,
							costCircuitBreakerMultiplier: config.costCircuitBreakerMultiplier,
						};
					}),
				),
			);
	}),
);
