/**
 * Auth FiberRef Bridge
 *
 * Provides request-scoped Better Auth instance access via Effect FiberRef.
 * This enables dependency injection without prop drilling.
 *
 * The Better Auth instance will be initialized in the server setup
 * and made available to all handlers through this context.
 */

import { FiberRef, Effect } from "effect";
import type { Auth } from "../auth-config.js";

/**
 * FiberRef for request-scoped Better Auth instance
 */
export const AuthRef = FiberRef.unsafeMake<Auth>(null as any);

/**
 * Get the auth instance from the current fiber context
 */
export const getAuth = Effect.gen(function* () {
  return yield* FiberRef.get(AuthRef);
});

/**
 * Execute an effect with auth instance in scope
 */
export const withAuth = <A, E, R>(
  auth: Auth,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> => {
  return Effect.gen(function* () {
    yield* FiberRef.set(AuthRef, auth);
    return yield* effect;
  });
};
