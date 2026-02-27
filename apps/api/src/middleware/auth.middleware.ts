/**
 * Auth Middleware Implementations
 *
 * - AuthMiddlewareLive: Strict — fails with Unauthorized when no session.
 * - OptionalAuthMiddlewareLive: Lenient — returns undefined for anonymous users.
 */

import { HttpServerRequest } from "@effect/platform";
import { AuthMiddleware, OptionalAuthMiddleware } from "@workspace/contracts";
import { Unauthorized } from "@workspace/domain";
import { BetterAuthService } from "@workspace/infrastructure";
import { Effect, Layer } from "effect";

/**
 * Convert Effect Platform Headers to Fetch API Headers
 *
 * Better Auth expects standard Fetch API Headers for getSession().
 * Effect Platform headers are a custom Headers type — we convert
 * via the underlying entries.
 *
 * Cookie array values are joined with "; " (semicolon-delimited)
 * per HTTP cookie spec. Other multi-value headers use ", ".
 */
const toFetchHeaders = (requestHeaders: unknown): Headers => {
	if (requestHeaders instanceof Headers) {
		return requestHeaders;
	}

	const headers = new Headers();

	if (typeof requestHeaders !== "object" || requestHeaders === null) {
		return headers;
	}

	for (const [key, value] of Object.entries(requestHeaders as Record<string, unknown>)) {
		if (value == null) {
			continue;
		}

		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			headers.set(key, String(value));
			continue;
		}

		if (Array.isArray(value)) {
			const normalizedValues = value
				.filter((item): item is string | number | boolean => item != null)
				.map((item) => String(item));
			if (normalizedValues.length === 0) {
				continue;
			}

			// Cookie header values must remain semicolon-delimited for session parsing.
			if (key.toLowerCase() === "cookie") {
				headers.set(key, normalizedValues.join("; "));
			} else {
				headers.set(key, normalizedValues.join(", "));
			}
		}
	}

	return headers;
};

/** Resolve session user ID from request headers via Better Auth */
const resolveUserId = (auth: {
	api: { getSession: (opts: { headers: Headers }) => Promise<unknown> };
}) =>
	Effect.gen(function* () {
		const request = yield* HttpServerRequest.HttpServerRequest;
		const session = (yield* Effect.tryPromise({
			try: () => auth.api.getSession({ headers: toFetchHeaders(request.headers) }),
			catch: (error) => error,
		}).pipe(Effect.catchAll(() => Effect.succeed(null)))) as {
			user?: { id?: string };
		} | null;

		return session?.user?.id;
	});

/**
 * AuthMiddlewareLive — Strict: fails with Unauthorized when no session
 */
export const AuthMiddlewareLive = Layer.effect(
	AuthMiddleware,
	Effect.gen(function* () {
		const auth = yield* BetterAuthService;

		return AuthMiddleware.of({
			sessionCookie: (_token) =>
				Effect.gen(function* () {
					const userId = yield* resolveUserId(auth);
					if (!userId) {
						return yield* Effect.fail(new Unauthorized({ message: "Authentication required" }));
					}
					return userId;
				}),
		});
	}),
);

/**
 * OptionalAuthMiddlewareLive — Always succeeds, returns userId or undefined
 */
export const OptionalAuthMiddlewareLive = Layer.effect(
	OptionalAuthMiddleware,
	Effect.gen(function* () {
		const auth = yield* BetterAuthService;

		return OptionalAuthMiddleware.of({
			sessionCookie: (_token) => resolveUserId(auth),
		});
	}),
);
