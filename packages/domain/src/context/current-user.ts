/**
 * CurrentUser Context Tag
 *
 * Provides the authenticated user ID (or undefined for anonymous users)
 * via Effect dependency injection. Populated by AuthMiddleware.
 *
 * Domain layer definition (port) — middleware implementation is in @workspace/api.
 *
 * @example
 * ```typescript
 * const userId = yield* CurrentUser;
 * if (!userId) {
 *   return yield* Effect.fail(new Unauthorized({ message: "Authentication required" }));
 * }
 * ```
 */
import { Context } from "effect";

export class CurrentUser extends Context.Tag("CurrentUser")<CurrentUser, string | undefined>() {}

export class AuthenticatedUser extends Context.Tag("AuthenticatedUser")<
	AuthenticatedUser,
	string
>() {}
