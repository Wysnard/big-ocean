// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	mockSession,
	mockLoaderData,
	mockListSessionsQuery,
	mockUseGetResults,
	mockUseListConversations,
	mockIdentityHeroSection,
	mockUseHasCheckIns,
	mockUseSubscriptionState,
	mockUseActivateExtension,
} = vi.hoisted(() => ({
	mockSession: vi.fn(),
	mockLoaderData: vi.fn(),
	mockListSessionsQuery: vi.fn(),
	mockUseGetResults: vi.fn(),
	mockUseListConversations: vi.fn(),
	mockIdentityHeroSection: vi.fn(),
	mockUseHasCheckIns: vi.fn(() => ({
		data: { hasCheckIns: false },
		isLoading: false,
		isError: false,
	})),
	mockUseSubscriptionState: vi.fn(() => ({
		data: {
			subscriptionStatus: "none" as const,
			isEntitledToConversationExtension: false,
			subscribedSince: null,
		},
		isPending: false,
		isError: false,
		isFetching: false,
		error: null,
		refetch: vi.fn(),
	})),
	mockUseActivateExtension: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
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
	useNavigate: () => vi.fn(),
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
	useListConversations: (...args: unknown[]) => mockUseListConversations(...args),
}));

vi.mock("@/hooks/use-subscription-state", () => ({
	useSubscriptionState: () => mockUseSubscriptionState(),
	pollUntilConversationExtensionEntitled: vi.fn(),
	subscriptionStateQueryKey: ["purchase", "subscription-state"],
}));

vi.mock("@/hooks/use-activate-extension", () => ({
	useActivateExtension: () => mockUseActivateExtension(),
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
		mockUseListConversations.mockReturnValue({
			data: {
				sessions: [
					{
						id: "session-completed",
						createdAt: new Date("2026-02-15T00:00:00.000Z"),
						updatedAt: new Date("2026-02-15T00:00:00.000Z"),
						status: "completed",
						messageCount: 24,
						oceanCode5: "OCEAR",
						archetypeName: "Deep Current",
					},
				],
				assessmentTurnCount: 15,
			},
			isLoading: false,
			isError: false,
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
		mockUseSubscriptionState.mockReturnValue({
			data: {
				subscriptionStatus: "none",
				isEntitledToConversationExtension: false,
				subscribedSince: null,
			},
			isPending: false,
			isError: false,
			isFetching: false,
			error: null,
			refetch: vi.fn(),
		});
		mockUseActivateExtension.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			isError: false,
		});
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
		mockUseListConversations.mockReturnValue({
			data: {
				sessions: [
					{
						id: "session-completed",
						createdAt: new Date("2026-02-15T00:00:00.000Z"),
						updatedAt: new Date("2026-02-15T00:00:00.000Z"),
						status: "completed",
						messageCount: 24,
						oceanCode5: "OCEAR",
						archetypeName: "Deep Current",
					},
				],
				assessmentTurnCount: 15,
			},
			isLoading: false,
			isError: false,
		});
	});

	it("renders me-page sections for a completed assessment (growth only when user has check-ins)", async () => {
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		expect(await screen.findByTestId("me-section-identity-hero")).toBeTruthy();
		expect(screen.getByTestId("me-section-portrait")).toBeTruthy();
		expect(screen.getByTestId("me-section-conversation-history")).toBeTruthy();
		expect(screen.getByTestId("conversation-history-list")).toBeTruthy();
		expect(screen.queryByTestId("me-section-growth")).toBeNull();
		expect(screen.getByTestId("me-section-public-face")).toBeTruthy();
		expect(screen.getByTestId("me-section-circle")).toBeTruthy();
		expect(screen.getByTestId("mock-your-circle-preview-section")).toBeTruthy();
		expect(screen.getByTestId("me-section-subscription")).toBeTruthy();
		expect(screen.getByTestId("me-section-account")).toBeTruthy();
		expect(await screen.findByTestId("me-settings-link")).toHaveAttribute("href", "/settings");
		expect(mockUseGetResults).toHaveBeenCalledWith("session-completed");
		expect(screen.getByText("Deep Current")).toBeTruthy();
		expect(screen.getByText(/OCEAR/)).toBeTruthy();
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
		expect(screen.getByTestId("me-section-conversation-history")).toHaveAttribute(
			"aria-busy",
			"true",
		);
		expect(screen.getByTestId("me-section-account")).toHaveAttribute("aria-busy", "true");
	});

	it("renders active and finalizing conversations in chronological history", async () => {
		mockUseListConversations.mockReturnValue({
			data: {
				sessions: [
					{
						id: "session-active",
						createdAt: new Date("2026-02-20T00:00:00.000Z"),
						updatedAt: new Date("2026-02-20T00:00:00.000Z"),
						status: "active",
						messageCount: 3,
						oceanCode5: null,
						archetypeName: null,
					},
					{
						id: "session-finalizing",
						createdAt: new Date("2026-02-19T00:00:00.000Z"),
						updatedAt: new Date("2026-02-19T00:00:00.000Z"),
						status: "finalizing",
						messageCount: 15,
						oceanCode5: null,
						archetypeName: null,
					},
					{
						id: "session-completed",
						createdAt: new Date("2026-02-18T00:00:00.000Z"),
						updatedAt: new Date("2026-02-18T00:00:00.000Z"),
						status: "completed",
						messageCount: 24,
						oceanCode5: "OCEAR",
						archetypeName: "Deep Current",
					},
				],
				assessmentTurnCount: 15,
			},
			isLoading: false,
			isError: false,
		});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		const items = await screen.findAllByTestId("conversation-history-item");
		expect(items).toHaveLength(3);
		expect(items[0]).toHaveAttribute("data-session-status", "active");
		expect(items[1]).toHaveAttribute("data-session-status", "finalizing");
		expect(items[2]).toHaveAttribute("data-session-status", "completed");
		expect(screen.getByText("In progress")).toBeTruthy();
		expect(screen.getByText("Finalizing")).toBeTruthy();
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

	it("shows SubscriptionValueSummary when the user is entitled to conversation extension", async () => {
		mockUseSubscriptionState.mockReturnValue({
			data: {
				subscriptionStatus: "active",
				isEntitledToConversationExtension: true,
				subscribedSince: "2025-01-15T00:00:00.000Z",
			},
			isPending: false,
			isError: false,
			isFetching: false,
			error: null,
			refetch: vi.fn(),
		});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		expect(await screen.findByTestId("subscription-value-summary")).toBeTruthy();
		expect(screen.getByTestId("subscription-extend-conversation-cta")).toBeTruthy();
		expect(screen.queryByTestId("mock-subscription-pitch-section")).toBeNull();
	});

	it("disables subscription extend CTA while activateExtension is pending", async () => {
		mockUseSubscriptionState.mockReturnValue({
			data: {
				subscriptionStatus: "active",
				isEntitledToConversationExtension: true,
				subscribedSince: "2025-01-15T00:00:00.000Z",
			},
			isPending: false,
			isError: false,
			isFetching: false,
			error: null,
			refetch: vi.fn(),
		});
		mockUseActivateExtension.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: true,
			isError: false,
		});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		expect(await screen.findByTestId("subscription-extend-conversation-cta")).toBeDisabled();
	});

	it("shows subscription loading copy while the subscription query is pending", async () => {
		mockUseSubscriptionState.mockReturnValue({
			data: undefined,
			isPending: true,
			isError: false,
			isFetching: true,
			error: null,
			refetch: vi.fn(),
		});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		expect(await screen.findByTestId("subscription-section-loading")).toBeTruthy();
		expect(screen.queryByTestId("mock-subscription-pitch-section")).toBeNull();
	});

	it("shows subscription error copy when the subscription query fails", async () => {
		mockUseSubscriptionState.mockReturnValue({
			data: undefined,
			isPending: false,
			isError: true,
			isFetching: false,
			error: new Error("subscription fetch failed"),
			refetch: vi.fn(),
		});
		const Component = MeRoute.component as ComponentType;

		render(<Component />);

		expect(await screen.findByTestId("subscription-section-error")).toBeTruthy();
		expect(screen.queryByTestId("mock-subscription-pitch-section")).toBeNull();
	});

	it("calls subscription refetch when Try again is clicked", async () => {
		const refetch = vi.fn().mockResolvedValue({ data: undefined });
		mockUseSubscriptionState.mockReturnValue({
			data: undefined,
			isPending: false,
			isError: true,
			isFetching: false,
			error: new Error("subscription fetch failed"),
			refetch,
		});
		const Component = MeRoute.component as ComponentType;
		const user = userEvent.setup();

		render(<Component />);

		await user.click(await screen.findByTestId("subscription-section-retry"));
		expect(refetch).toHaveBeenCalledTimes(1);
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
