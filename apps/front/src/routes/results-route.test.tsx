// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

const mockCreateFileRoute = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: (...args: unknown[]) => mockCreateFileRoute(...args),
	Outlet: () => null,
	useNavigate: () => vi.fn(),
	useRouterState: () => "/results",
}));

mockCreateFileRoute.mockImplementation(() => (options: Record<string, unknown>) => ({
	...options,
}));

describe("/results route shell", () => {
	it("registers the /results route", async () => {
		const { Route } = await import("./results");
		expect(Route).toBeDefined();
		expect(Route.component).toBeDefined();
	});
});
