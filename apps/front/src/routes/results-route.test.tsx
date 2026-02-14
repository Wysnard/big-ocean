// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

const mockCreateFileRoute = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: (...args: unknown[]) => mockCreateFileRoute(...args),
	redirect: (options: Record<string, unknown>) => ({ options }),
	Outlet: () => null,
	useNavigate: () => vi.fn(),
	useRouterState: () => "/results",
}));

mockCreateFileRoute.mockImplementation(() => (options: Record<string, unknown>) => ({
	...options,
}));

describe("/results canonicalization", () => {
	it("redirects /results?sessionId=... to /results/$sessionId", async () => {
		const { Route } = await import("./results");
		const beforeLoad = Route.beforeLoad as (args: {
			search: { sessionId?: string; scrollToFacet?: string };
		}) => void;

		try {
			beforeLoad({ search: { sessionId: "session-123", scrollToFacet: "ideas" } });
			throw new Error("Expected redirect");
		} catch (error) {
			const redirectError = error as { options?: Record<string, unknown> };
			expect(redirectError.options).toMatchObject({
				to: "/results/$sessionId",
				params: { sessionId: "session-123" },
				search: { scrollToFacet: "ideas" },
				replace: true,
			});
		}
	});

	it("does not redirect when sessionId is missing", async () => {
		const { Route } = await import("./results");
		const beforeLoad = Route.beforeLoad as (args: {
			search: { sessionId?: string; scrollToFacet?: string };
		}) => void;

		expect(() => beforeLoad({ search: {} })).not.toThrow();
	});
});
