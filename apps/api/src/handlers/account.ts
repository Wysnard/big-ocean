/**
 * Account Presenters (HTTP Handlers) — Story 30-2
 *
 * Thin presenter layer for account management.
 * Business logic lives in use cases.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { AuthenticatedUser } from "@workspace/domain";
import { Effect } from "effect";
import { completeFirstVisit, deleteAccount, getFirstVisitState } from "../use-cases/index";

export const AccountGroupLive = HttpApiBuilder.group(BigOceanApi, "account", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("getFirstVisitState", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;

					return yield* getFirstVisitState(userId);
				}),
			)
			.handle("completeFirstVisit", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;

					return yield* completeFirstVisit(userId);
				}),
			)
			.handle("deleteAccount", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;

					const result = yield* deleteAccount(userId);

					return {
						success: result.success,
					};
				}),
			);
	}),
);
