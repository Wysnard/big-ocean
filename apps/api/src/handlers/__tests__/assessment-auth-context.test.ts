/**
 * AuthMiddlewareLive Tests (Story 1.4)
 *
 * Tests the Effect/Platform middleware layer that extracts authenticated
 * user ID from Better Auth session cookies. Tests the full middleware
 * handler including header normalization and error handling.
 */

import { HttpServerRequest } from "@effect/platform";
import { AuthMiddleware } from "@workspace/contracts";
import { BetterAuthService } from "@workspace/infrastructure";
import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";
import { AuthMiddlewareLive } from "../../middleware/auth.middleware";

/**
 * Helper: Run the AuthMiddleware sessionCookie handler with mock dependencies.
 *
 * Provides a mock BetterAuthService and mock HttpServerRequest,
 * then extracts the AuthMiddleware service and calls its sessionCookie handler.
 */
const runAuthMiddleware = (
	getSession: (...args: any[]) => Promise<any>,
	requestHeaders: Record<string, unknown>,
) => {
	const authLayer = Layer.succeed(BetterAuthService, {
		api: { getSession },
	} as unknown as never);

	const middlewareLayer = AuthMiddlewareLive.pipe(Layer.provide(authLayer));

	return Effect.gen(function* () {
		const middleware = yield* AuthMiddleware;
		// sessionCookie handler receives a Redacted token (ignored, uses request headers)
		return yield* middleware.sessionCookie("" as any);
	}).pipe(
		Effect.provide(middlewareLayer),
		Effect.provideService(HttpServerRequest.HttpServerRequest, {
			headers: requestHeaders,
		} as unknown as HttpServerRequest.HttpServerRequest),
		Effect.runPromise,
	);
};

describe("AuthMiddlewareLive", () => {
	it("returns authenticated user id from Better Auth session", async () => {
		const getSession = vi.fn(async ({ headers }: { headers: Headers }) => {
			expect(headers.get("cookie")).toContain("better-auth");
			expect(headers.get("x-forwarded-for")).toContain("10.0.0.1");
			return { user: { id: "user_123" } };
		});

		const userId = await runAuthMiddleware(getSession, {
			cookie: "better-auth=token",
			"x-forwarded-for": ["10.0.0.1", "10.0.0.2"],
		});

		expect(userId).toBe("user_123");
		expect(getSession).toHaveBeenCalledTimes(1);
	});

	it("returns undefined when no authenticated session exists", async () => {
		const getSession = vi.fn(async () => null);

		const userId = await runAuthMiddleware(getSession, {
			cookie: "",
		});

		expect(userId).toBeUndefined();
	});

	it("returns undefined when Better Auth session lookup throws", async () => {
		const getSession = vi.fn(async () => {
			throw new Error("auth service unavailable");
		});

		const userId = await runAuthMiddleware(getSession, {
			cookie: "better-auth=token",
		});

		expect(userId).toBeUndefined();
		expect(getSession).toHaveBeenCalledTimes(1);
	});

	it("normalizes array and scalar headers before Better Auth lookup", async () => {
		const getSession = vi.fn(async ({ headers }: { headers: Headers }) => {
			expect(headers.get("cookie")).toBe("better-auth=token; theme=dark");
			expect(headers.get("x-forwarded-port")).toBe("443");
			expect(headers.get("x-forwarded-proto")).toBe("https");
			expect(headers.get("x-forwarded-for")).toBe("10.0.0.1, 10.0.0.2");
			return { user: { id: "user_from_headers" } };
		});

		const userId = await runAuthMiddleware(getSession, {
			cookie: ["better-auth=token", "theme=dark"],
			"x-forwarded-port": 443,
			"x-forwarded-proto": "https",
			"x-forwarded-for": ["10.0.0.1", "10.0.0.2"],
		});

		expect(userId).toBe("user_from_headers");
		expect(getSession).toHaveBeenCalledTimes(1);
	});
});
