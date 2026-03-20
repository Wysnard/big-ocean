import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/user-account.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { describe, expect, it } from "@effect/vitest";
import type { LoggerRepository } from "@workspace/domain";
import { UserAccountRepository } from "@workspace/domain";
import {
	addMockUser,
	resetMockUsers,
	setMockDbError,
	wasMockUserDeleted,
} from "@workspace/infrastructure/repositories/__mocks__/user-account.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { UserAccountDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/user-account.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { beforeEach } from "vitest";
import { deleteAccount } from "../delete-account.use-case";

const TestLayer = Layer.mergeAll(
	UserAccountDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
) as Layer.Layer<UserAccountRepository | LoggerRepository>;

const USER_ID = "user-to-delete";

describe("deleteAccount", () => {
	beforeEach(() => {
		resetMockUsers();
	});

	it.effect("successfully deletes an existing user account", () =>
		Effect.gen(function* () {
			addMockUser(USER_ID);

			const result = yield* deleteAccount(USER_ID);

			expect(result.success).toBe(true);
			expect(wasMockUserDeleted(USER_ID)).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with AccountNotFound when user does not exist", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(deleteAccount("non-existent-user"));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause.toString();
				expect(error).toContain("AccountNotFound");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("propagates DatabaseError from repository without remapping", () =>
		Effect.gen(function* () {
			addMockUser(USER_ID);
			setMockDbError(true);

			const exit = yield* Effect.exit(deleteAccount(USER_ID));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause.toString();
				expect(error).toContain("DatabaseError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("does not affect other users", () =>
		Effect.gen(function* () {
			addMockUser(USER_ID);
			addMockUser("other-user");

			yield* deleteAccount(USER_ID);

			expect(wasMockUserDeleted(USER_ID)).toBe(true);
			expect(wasMockUserDeleted("other-user")).toBe(false);
		}).pipe(Effect.provide(TestLayer)),
	);
});
