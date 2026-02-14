import { BetterAuthService } from "@workspace/infrastructure";
import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";
import { resolveAuthenticatedUserId } from "../assessment";

describe("resolveAuthenticatedUserId", () => {
	it("returns authenticated user id from Better Auth session", async () => {
		const getSession = vi.fn(async ({ headers }: { headers: Headers }) => {
			expect(headers.get("cookie")).toContain("better-auth");
			expect(headers.get("x-forwarded-for")).toContain("10.0.0.1");
			return { user: { id: "user_123" } };
		});

		const authLayer = Layer.succeed(BetterAuthService, {
			api: { getSession },
		} as unknown as never);

		const userId = await Effect.runPromise(
			resolveAuthenticatedUserId({
				headers: {
					cookie: "better-auth=token",
					"x-forwarded-for": ["10.0.0.1", "10.0.0.2"],
				},
			}).pipe(Effect.provide(authLayer)),
		);

		expect(userId).toBe("user_123");
		expect(getSession).toHaveBeenCalledTimes(1);
	});

	it("returns undefined when no authenticated session exists", async () => {
		const getSession = vi.fn(async () => null);
		const authLayer = Layer.succeed(BetterAuthService, {
			api: { getSession },
		} as unknown as never);

		const userId = await Effect.runPromise(
			resolveAuthenticatedUserId({
				headers: {
					cookie: "",
				},
			}).pipe(Effect.provide(authLayer)),
		);

		expect(userId).toBeUndefined();
	});

	it("returns undefined when Better Auth session lookup throws", async () => {
		const getSession = vi.fn(async () => {
			throw new Error("auth service unavailable");
		});
		const authLayer = Layer.succeed(BetterAuthService, {
			api: { getSession },
		} as unknown as never);

		const userId = await Effect.runPromise(
			resolveAuthenticatedUserId({
				headers: {
					cookie: "better-auth=token",
				},
			}).pipe(Effect.provide(authLayer)),
		);

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

		const authLayer = Layer.succeed(BetterAuthService, {
			api: { getSession },
		} as unknown as never);

		const userId = await Effect.runPromise(
			resolveAuthenticatedUserId({
				headers: {
					cookie: ["better-auth=token", "theme=dark"],
					"x-forwarded-port": 443,
					"x-forwarded-proto": "https",
					"x-forwarded-for": ["10.0.0.1", "10.0.0.2"],
				},
			}).pipe(Effect.provide(authLayer)),
		);

		expect(userId).toBe("user_from_headers");
		expect(getSession).toHaveBeenCalledTimes(1);
	});
});
