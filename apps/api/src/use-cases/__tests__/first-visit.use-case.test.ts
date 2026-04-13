import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/user-account.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { describe, expect, it } from "@effect/vitest";
import type { LoggerRepository } from "@workspace/domain";
import { UserAccountRepository } from "@workspace/domain";
import {
	addMockUser,
	getMockFirstVisitCompleted,
	resetMockUsers,
	setMockDbError,
	setMockFirstVisitCompleted,
} from "@workspace/infrastructure/repositories/__mocks__/user-account.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { UserAccountDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/user-account.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { beforeEach } from "vitest";
import { completeFirstVisit } from "../complete-first-visit.use-case";
import { getFirstVisitState } from "../get-first-visit-state.use-case";

const TestLayer = Layer.mergeAll(
	UserAccountDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
) as Layer.Layer<UserAccountRepository | LoggerRepository>;

const USER_ID = "first-visit-user";

describe("first visit use cases", () => {
	beforeEach(() => {
		resetMockUsers();
	});

	it.effect("reads the current first visit state", () =>
		Effect.gen(function* () {
			addMockUser(USER_ID);
			setMockFirstVisitCompleted(USER_ID, true);

			const result = yield* getFirstVisitState(USER_ID);

			expect(result.firstVisitCompleted).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("marks the first visit as completed", () =>
		Effect.gen(function* () {
			addMockUser(USER_ID);

			const result = yield* completeFirstVisit(USER_ID);

			expect(result.firstVisitCompleted).toBe(true);
			expect(getMockFirstVisitCompleted(USER_ID)).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with AccountNotFound when completing a missing account", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(completeFirstVisit("missing-user"));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				expect(exit.cause.toString()).toContain("AccountNotFound");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("propagates database errors while reading visit state", () =>
		Effect.gen(function* () {
			addMockUser(USER_ID);
			setMockDbError(true);

			const exit = yield* Effect.exit(getFirstVisitState(USER_ID));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				expect(exit.cause.toString()).toContain("DatabaseError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});
