import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/user-account.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { describe, expect, it } from "@effect/vitest";
import type { LoggerRepository } from "@workspace/domain";
import { UserAccountRepository } from "@workspace/domain";
import {
	addMockUser,
	getMockFirstDailyPromptScheduledFor,
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
import { scheduleFirstDailyPrompt } from "../schedule-first-daily-prompt.use-case";

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

	it.effect("persists the first daily prompt schedule", () =>
		Effect.gen(function* () {
			addMockUser(USER_ID);
			const scheduledFor = new Date("2026-04-15T19:00:00.000Z");

			const result = yield* scheduleFirstDailyPrompt({
				userId: USER_ID,
				scheduledFor,
			});

			expect(result.success).toBe(true);
			expect(result.scheduledFor.toISOString()).toBe("2026-04-15T19:00:00.000Z");
			expect(getMockFirstDailyPromptScheduledFor(USER_ID)?.toISOString()).toBe(
				"2026-04-15T19:00:00.000Z",
			);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("succeeds idempotently when the first daily prompt is already scheduled", () =>
		Effect.gen(function* () {
			addMockUser(USER_ID);
			const first = new Date("2026-04-15T19:00:00.000Z");
			const second = new Date("2026-04-16T19:00:00.000Z");

			yield* scheduleFirstDailyPrompt({
				userId: USER_ID,
				scheduledFor: first,
			});

			const result = yield* scheduleFirstDailyPrompt({
				userId: USER_ID,
				scheduledFor: second,
			});

			expect(result.success).toBe(true);
			expect(result.scheduledFor.toISOString()).toBe("2026-04-15T19:00:00.000Z");
			expect(getMockFirstDailyPromptScheduledFor(USER_ID)?.toISOString()).toBe(
				"2026-04-15T19:00:00.000Z",
			);
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

	it.effect("fails with AccountNotFound when scheduling for a missing account", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				scheduleFirstDailyPrompt({
					userId: "missing-user",
					scheduledFor: new Date("2026-04-15T19:00:00.000Z"),
				}),
			);

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
