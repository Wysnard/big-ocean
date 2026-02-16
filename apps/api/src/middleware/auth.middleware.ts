/**
 * AuthMiddleware Implementation
 *
 * Effect/Platform middleware that extracts the authenticated user ID
 * from the Better Auth session cookie. Always succeeds — provides
 * `string | undefined` via CurrentUser Context.Tag.
 *
 * The security handler receives the cookie token via HttpApiSecurity,
 * but we use the full request headers from HttpServerRequest to call
 * Better Auth's getSession() (which needs all headers for CSRF/origin checks).
 */

import { HttpServerRequest } from "@effect/platform";
import { AuthMiddleware } from "@workspace/contracts";
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

/**
 * AuthMiddlewareLive - Layer implementation for AuthMiddleware
 *
 * Security handler receives the cookie value via HttpApiSecurity.apiKey,
 * but ignores it in favor of full request headers for Better Auth session lookup.
 * Always succeeds — returns user ID or undefined.
 */
export const AuthMiddlewareLive = Layer.effect(
	AuthMiddleware,
	Effect.gen(function* () {
		const auth = yield* BetterAuthService;

		return AuthMiddleware.of({
			sessionCookie: (_token) =>
				Effect.gen(function* () {
					const request = yield* HttpServerRequest.HttpServerRequest;
					const session = (yield* Effect.tryPromise({
						try: () => auth.api.getSession({ headers: toFetchHeaders(request.headers) }),
						catch: (error) => error,
					}).pipe(Effect.catchAll(() => Effect.succeed(null)))) as {
						user?: { id?: string };
					} | null;

					return session?.user?.id;
				}),
		});
	}),
);
