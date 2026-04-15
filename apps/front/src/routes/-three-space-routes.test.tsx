// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	mockSession,
	mockLoaderData,
	mockListSessionsQuery,
	mockUseGetResults,
	mockIdentityHeroSection,
	mockUseHasCheckIns,
} = vi.hoisted(() => ({
	mockSession: vi.fn(),
	mockLoaderData: vi.fn(),
	mockListSessionsQuery: vi.fn(),
	mockUseGetResults: vi.fn(),
	mockIdentityHeroSection: vi.fn(),
	mockUseHasCheckIns: vi.fn(() => ({
		data: { hasCheckIns: false },
		isLoading: false,
		isError: false,
	})),
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

vi.mock("@/components/me/IdentityHeroSection", () => ({
	IdentityHeroSection: (props: { results: unknown }) => {
		mockIdentityHeroSection(props);
		return <div data-testid="mock-identity-hero-section" />;
	},
}));

vi.mock("@/components/me/YourPublicFaceSection", () => ({
	YourPublicFaceSection: () => <div data-testid="mock-your-public-face-section" />,
}));

vi.mock("@/components/me/SubscriptionPitchSection", () => ({
	SubscriptionPitchSection: () => <div data-testid="mock-subscription-pitch-section" />,
}));

vi.mock("@/components/me/YourCirclePreviewSection", () => ({
	YourCirclePreviewSection: () => <div data-testid="mock-your-circle-preview-section" />,
}));

vi.mock("@/components/today/TodayCheckInSurface", () => ({
	TodayCheckInSurface: () => (
		<div data-testid="today-check-in-surface">How are you feeling this morning?</div>
	),
}));

vi.mock("@/hooks/use-has-check-ins", () => ({
	useHasCheckIns: () => mockUseHasCheckIns(),
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
		mockLoaderData.mockReturnValue({ sessionId: "session-completed" });
		mockListSessionsQuery.mockResolvedValue({
			sessions: [{ id: "session-completed", status: "completed" }],
			assessmentTurnCount: 30,
		});
		mockUseGetResults.mockReturnValue({
			data: {
				archetypeName: "Deep Current",
				archetypeDescription: "A calm, observant presence.",
				oceanCode5: "OCEAR",
				overallConfidence: 82,
				messageCount: 24,
				isPublic: false,
				traits: [],
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

	it("allows authenticated users into /today without a first-visit gate", async () => {
		await expect(TodayRoute.beforeLoad?.()).resolves.toBeUndefined();
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
		mockUseHasCheckIns.mockReturnValue({
			data: { hasCheckIns: false },
			isLoading: false,
			isError: false,
		});
		mockLoaderData.mockReturnValue({ sessionId: "session-completed" });
		mockUseGetResults.mockReturnValue({
			data: {
				archetypeName: "Deep Current",
				archetypeDescription: "A calm, observant presence.",
				oceanCode5: "OCEAR",
				overallConfidence: 82,
				messageCount: 24,
				isPublic: false,
				traits: [],
			},
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
	});

	it("renders me-page sections for a completed assessment (growth only when user has check-ins)", async () => {
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		expect(await screen.findByTestId("me-section-identity-hero")).toBeTruthy();
		expect(screen.getByTestId("me-section-portrait")).toBeTruthy();
		expect(screen.queryByTestId("me-section-growth")).toBeNull();
		expect(screen.getByTestId("me-section-public-face")).toBeTruthy();
		expect(screen.getByTestId("me-section-circle")).toBeTruthy();
		expect(screen.getByTestId("mock-your-circle-preview-section")).toBeTruthy();
		expect(screen.getByTestId("me-section-subscription")).toBeTruthy();
		expect(screen.getByTestId("me-section-account")).toBeTruthy();
		expect(await screen.findByTestId("me-settings-link")).toHaveAttribute("href", "/settings");
		expect(mockUseGetResults).toHaveBeenCalledWith("session-completed");
		expect(mockIdentityHeroSection).toHaveBeenCalledWith(
			expect.objectContaining({
				results: expect.objectContaining({
					archetypeName: "Deep Current",
					oceanCode5: "OCEAR",
					overallConfidence: 82,
					messageCount: 24,
				}),
			}),
		);
		expect(screen.getByTestId("bottom-nav-root")).toBeTruthy();
	});

	it("renders Your Growth with a calendar link when the user has check-in history", async () => {
		mockUseHasCheckIns.mockReturnValue({
			data: { hasCheckIns: true },
			isLoading: false,
			isError: false,
		});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		expect(await screen.findByTestId("me-section-growth")).toBeTruthy();
		expect(screen.getByTestId("me-growth-calendar-link")).toHaveAttribute("href", "/today/calendar");
	});

	it("shows loading skeletons when results are loading", async () => {
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
	});

	it("shows an error banner when results fail to load", async () => {
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
	});

	it("does not consume any Today-route onboarding state from the /me scaffold alone", () => {
		const Component = MeRoute.component as ComponentType;

		render(<Component />);
		expect(screen.getByTestId("me-section-identity-hero")).toBeTruthy();
	});
});

describe("Today route layout", () => {
	it("renders the real Today surface instead of the placeholder copy", () => {
		const Component = TodayRoute.component as ComponentType;

		render(<Component />);

		expect(screen.getByTestId("today-check-in-surface")).toBeTruthy();
		expect(screen.queryByText("Today is your quiet rhythm.")).toBeNull();
	});
});
