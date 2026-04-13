// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSession, mockFetchFirstVisitState, mockCompleteFirstVisit } = vi.hoisted(() => ({
	mockSession: vi.fn(),
	mockFetchFirstVisitState: vi.fn(),
	mockCompleteFirstVisit: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: Record<string, unknown>) => options,
	redirect: (options: Record<string, unknown>) => {
		const error = new Error("redirect");
		Object.assign(error, options);
		return error;
	},
	Link: ({ children, to, ...props }: Record<string, unknown> & { children?: ReactNode }) => (
		<a href={to as string} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@/lib/auth-client", () => ({
	getSession: () => mockSession(),
}));

vi.mock("@/hooks/use-account", () => ({
	fetchFirstVisitState: () => mockFetchFirstVisitState(),
	completeFirstVisit: () => mockCompleteFirstVisit(),
}));

vi.mock("@/components/BottomNav", () => ({
	BottomNav: () => <div data-testid="mock-bottom-nav" />,
}));

import { Route as CircleRoute } from "./circle/index";
import { Route as MeRoute } from "./me/index";
import { Route as TodayRoute } from "./today/index";

describe("three-space route guards", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFetchFirstVisitState.mockResolvedValue({ firstVisitCompleted: true });
		mockCompleteFirstVisit.mockResolvedValue({ firstVisitCompleted: true });
	});

	it("redirects unauthenticated users from /today to /login", async () => {
		mockSession.mockResolvedValue({ data: null });

		await expect(TodayRoute.beforeLoad?.()).rejects.toMatchObject({ to: "/login" });
	});

	it("redirects first-time /today visits to /me", async () => {
		mockFetchFirstVisitState.mockResolvedValue({ firstVisitCompleted: false });

		await expect(TodayRoute.beforeLoad?.()).rejects.toMatchObject({ to: "/me" });
	});

	it("redirects unauthenticated users from /me and /circle to /login", async () => {
		mockSession.mockResolvedValue({ data: null });

		await expect(MeRoute.beforeLoad?.()).rejects.toMatchObject({ to: "/login" });
		await expect(CircleRoute.beforeLoad?.()).rejects.toMatchObject({ to: "/login" });
	});
});

describe("Me route shell", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCompleteFirstVisit.mockResolvedValue({ firstVisitCompleted: true });
	});

	it("marks first visit complete when the Me surface renders", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		expect(await screen.findByTestId("me-settings-link")).toHaveAttribute("href", "/settings");
		await waitFor(() => {
			expect(mockCompleteFirstVisit).toHaveBeenCalledTimes(1);
		});
		expect(screen.getByTestId("mock-bottom-nav")).toBeTruthy();
		warnSpy.mockRestore();
	});
});
