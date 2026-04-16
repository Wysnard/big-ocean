/**
 * Internal / cron HTTP handlers (Story 5.1)
 */

import { HttpApiBuilder, HttpServerRequest } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { Effect } from "effect";
import {
	evaluateFreeTierCostCircuitBreaker,
	generateWeeklySummariesForWeek,
} from "../use-cases/index";

const getCronSecretHeader = (headers: unknown): string | undefined => {
	if (headers instanceof Headers) {
		return headers.get("x-cron-secret") ?? undefined;
	}
	if (typeof headers === "object" && headers !== null) {
		const h = headers as Record<string, string | string[] | undefined>;
		const v = h["x-cron-secret"] ?? h["X-Cron-Secret"];
		if (Array.isArray(v)) return v[0];
		return typeof v === "string" ? v : undefined;
	}
	return undefined;
};

export const JobsGroupLive = HttpApiBuilder.group(BigOceanApi, "jobs", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("generateWeeklySummaries", ({ payload }) =>
				Effect.gen(function* () {
					const request = yield* HttpServerRequest.HttpServerRequest;
					return yield* generateWeeklySummariesForWeek({
						weekId: payload.weekId,
						cronSecretHeader: getCronSecretHeader(request.headers),
					});
				}),
			)
			.handle("evaluateCostCircuitBreaker", () =>
				Effect.gen(function* () {
					const request = yield* HttpServerRequest.HttpServerRequest;
					return yield* evaluateFreeTierCostCircuitBreaker({
						cronSecretHeader: getCronSecretHeader(request.headers),
					});
				}),
			);
	}),
);
