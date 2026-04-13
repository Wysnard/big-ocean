// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	mockSession,
	mockFetchFirstVisitState,
	mockCompleteFirstVisit,
	mockLoaderData,
	mockListSessionsQuery,
	mockUseGetResults,
} = vi.hoisted(() => ({
	mockSession: vi.fn(),
	mockFetchFirstVisitState: vi.fn(),
	mockCompleteFirstVisit: vi.fn(),
	mockLoaderData: vi.fn(),
	mockListSessionsQuery: vi.fn(),
	mockUseGetResults: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: Record<string, unknown>) => ({
		...options,
		useLoaderData: () => mockLoaderData(),
	}),
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

vi.mock("@/hooks/use-conversation", () => ({
	listConversationsQueryOptions: () => ({
		queryKey: ["conversations", "list"],
		queryFn: () => mockListSessionsQuery(),
	}),
	useGetResults: (...args: unknown[]) => mockUseGetResults(...args),
}));

vi.mock("@/components/BottomNav", () => ({
	BottomNav: () => <div data-testid="bottom-nav-root" />,
}));

import { Route as CircleRoute } from "./circle/index";
import { Route as DashboardRoute } from "./dashboard";
import { Route as MeRoute } from "./me/index";
import { Route as TodayRoute } from "./today/index";

function createRouteContext() {
	return {
		context: {
			queryClient: {
				fetchQuery: vi.fn(async (options: { queryFn: () => Promise<unknown> }) => options.queryFn()),
			},
		},
	};
}

describe("dashboard redirect", () => {
	it("redirects /dashboard to /today with 301 status", () => {
		expect(() => DashboardRoute.beforeLoad?.()).toThrow();
		try {
			DashboardRoute.beforeLoad?.();
		} catch (e) {
			expect(e).toMatchObject({ to: "/today", statusCode: 301 });
		}
	});
});

describe("three-space route guards", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
		mockFetchFirstVisitState.mockResolvedValue({ firstVisitCompleted: true });
		mockCompleteFirstVisit.mockResolvedValue({ firstVisitCompleted: true });
		mockLoaderData.mockReturnValue({ sessionId: "session-completed" });
		mockListSessionsQuery.mockResolvedValue({
			sessions: [{ id: "session-completed", status: "completed" }],
			assessmentTurnCount: 30,
		});
		mockUseGetResults.mockReturnValue({
			data: {
				archetypeName: "Deep Current",
				archetypeDescription: "A calm, observant presence.",
				oceanCode5: "HHMHM",
				overallConfidence: 82,
				messageCount: 24,
				isPublic: false,
			},
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
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

		await expect(MeRoute.beforeLoad?.(createRouteContext() as never)).rejects.toMatchObject({
			to: "/login",
		});
		await expect(CircleRoute.beforeLoad?.()).rejects.toMatchObject({ to: "/login" });
	});

	it("redirects /me to /chat when the user has no completed assessment", async () => {
		mockListSessionsQuery.mockResolvedValue({
			sessions: [],
			assessmentTurnCount: 30,
		});

		await expect(MeRoute.beforeLoad?.(createRouteContext() as never)).rejects.toMatchObject({
			to: "/chat",
		});
	});

	it("redirects /me to the latest incomplete chat session when only in-progress work exists", async () => {
		mockListSessionsQuery.mockResolvedValue({
			sessions: [{ id: "session-active", status: "active" }],
			assessmentTurnCount: 30,
		});

		await expect(MeRoute.beforeLoad?.(createRouteContext() as never)).rejects.toMatchObject({
			to: "/chat",
			search: { sessionId: "session-active" },
		});
	});
});

describe("Me route layout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCompleteFirstVisit.mockResolvedValue({ firstVisitCompleted: true });
		mockLoaderData.mockReturnValue({ sessionId: "session-completed" });
		mockUseGetResults.mockReturnValue({
			data: {
				archetypeName: "Deep Current",
				archetypeDescription: "A calm, observant presence.",
				oceanCode5: "HHMHM",
				overallConfidence: 82,
				messageCount: 24,
				isPublic: false,
			},
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
	});

	it("renders the seven me-page sections for a completed assessment", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		expect(await screen.findByTestId("me-section-identity-hero")).toBeTruthy();
		expect(screen.getByTestId("me-section-portrait")).toBeTruthy();
		expect(screen.getByTestId("me-section-growth")).toHaveAttribute("hidden");
		expect(screen.getByTestId("me-section-public-face")).toBeTruthy();
		expect(screen.getByTestId("me-section-circle")).toBeTruthy();
		expect(screen.getByTestId("me-section-subscription")).toBeTruthy();
		expect(screen.getByTestId("me-section-account")).toBeTruthy();
		expect(await screen.findByTestId("me-settings-link")).toHaveAttribute("href", "/settings");
		expect(mockUseGetResults).toHaveBeenCalledWith("session-completed");
		await waitFor(() => {
			expect(mockCompleteFirstVisit).toHaveBeenCalledTimes(1);
		});
		expect(screen.getByTestId("bottom-nav-root")).toBeTruthy();
		warnSpy.mockRestore();
	});

	it("shows loading skeletons when results are loading", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		mockUseGetResults.mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
			refetch: vi.fn(),
		});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		const heroSection = await screen.findByTestId("me-section-identity-hero");
		expect(heroSection).toHaveAttribute("aria-busy", "true");
		expect(screen.getByTestId("me-section-account")).toHaveAttribute("aria-busy", "true");
		warnSpy.mockRestore();
	});

	it("shows an error banner when results fail to load", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		mockUseGetResults.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: new Error("Network failure"),
			refetch: vi.fn(),
		});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		await waitFor(() => {
			expect(screen.getByText("Network failure")).toBeTruthy();
		});
		warnSpy.mockRestore();
	});
});
