// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	mockUseParams,
	mockUseSearch,
	mockNavigate,
	mockUseAuth,
	mockUseGetResults,
	mockUsePortraitStatus,
	mockFetchFirstVisitState,
	mockCompleteFirstVisit,
	mockScheduleFirstDailyPrompt,
	mockSyncPushSubscription,
	mockUseSubscriptionQuery,
	mockUseActivateExtension,
} = vi.hoisted(() => ({
	mockUseParams: vi.fn(() => ({ conversationSessionId: "session-123" })),
	mockUseSearch: vi.fn(() => ({ scrollToFacet: undefined })),
	mockNavigate: vi.fn(),
	mockUseAuth: vi.fn(),
	mockUseGetResults: vi.fn(),
	mockUsePortraitStatus: vi.fn(() => ({ data: null, isError: false, refetch: vi.fn() })),
	mockFetchFirstVisitState: vi.fn(),
	mockCompleteFirstVisit: vi.fn(),
	mockScheduleFirstDailyPrompt: vi.fn(),
	mockSyncPushSubscription: vi.fn(),
	mockUseSubscriptionQuery: vi.fn(() => ({
		data: {
			subscriptionStatus: "none" as const,
			isEntitledToConversationExtension: false,
			subscribedSince: null,
		},
		isPending: false,
		isError: false,
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
		useParams: mockUseParams,
		useSearch: mockUseSearch,
	}),
	useNavigate: () => mockNavigate,
	Link: ({ children, ...props }: Record<string, unknown>) => (
		<a href={props.to as string}>{children as React.ReactNode}</a>
	),
}));

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => {
		const chain = {
			handler: (fn: unknown) => fn,
			inputValidator: () => chain,
		};
		return chain;
	},
}));

vi.mock("@tanstack/react-start/server", () => ({
	getRequestHeader: () => "",
}));

vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/use-account", () => ({
	fetchFirstVisitState: () => mockFetchFirstVisitState(),
	completeFirstVisit: () => mockCompleteFirstVisit(),
	scheduleFirstDailyPrompt: (input: unknown) => mockScheduleFirstDailyPrompt(input),
}));

vi.mock("@/hooks/use-conversation", () => ({
	useGetResults: (...args: unknown[]) => mockUseGetResults(...args),
	getResultsQueryOptions: (sessionId: string) => ({
		queryKey: ["conversation", "results", sessionId],
		queryFn: vi.fn(),
		staleTime: 5 * 60 * 1000,
	}),
	isConversationApiError: (error: unknown) =>
		typeof error === "object" && error !== null && "status" in error,
}));

vi.mock("@/hooks/use-activate-extension", () => ({
	useActivateExtension: () => mockUseActivateExtension(),
}));

vi.mock("@/hooks/use-evidence", () => ({
	useFacetEvidence: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/use-profile", () => ({
	useToggleVisibility: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/hooks/usePortraitStatus", () => ({
	usePortraitStatus: (...args: unknown[]) => mockUsePortraitStatus(...args),
}));

vi.mock("@/hooks/use-push-subscription-sync", () => ({
	syncPushSubscription: (input: unknown) => mockSyncPushSubscription(input),
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: vi.fn(), fetchQuery: vi.fn() }),
	useMutation: () => ({ mutate: vi.fn(), isPending: false, mutateAsync: vi.fn() }),
	queryOptions: <T extends Record<string, unknown>>(o: T) => o,
	useQuery: (...args: unknown[]) => mockUseSubscriptionQuery(...args),
}));

vi.mock("@/components/ResultsAuthGate", () => ({
	ResultsAuthGate: () => <div data-testid="mock-auth-gate">Mock Auth Gate</div>,
}));

vi.mock("@/components/results/useTraitEvidence", () => ({
	useTraitEvidence: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/components/results/ProfileView", () => ({
	ProfileView: ({
		children,
		conversationExtensionStrip,
	}: {
		children?: React.ReactNode;
		conversationExtensionStrip?: React.ReactNode;
	}) => (
		<div data-testid="results-content">
			{conversationExtensionStrip}
			{children}
		</div>
	),
}));

vi.mock("@/components/results/ShareProfileSection", () => ({
	ShareProfileSection: () => (
		<section data-testid="share-section" aria-label="Share your profile">
			Share section
		</section>
	),
}));

vi.mock("@/components/results/DetailZone", () => ({
	DetailZone: () => <div data-testid="detail-zone" />,
}));

vi.mock("@/components/relationship/RelationshipCard", () => ({
	RelationshipCard: () => (
		<section data-testid="relationship-card" aria-label="Relationship comparison">
			Relationship card
		</section>
	),
}));

vi.mock("@/components/relationship/RelationshipAnalysesList", () => ({
	RelationshipAnalysesList: () => (
		<section data-testid="relationship-analyses-list" aria-label="Relationship letters">
			Relationship letters
		</section>
	),
}));

vi.mock("@/components/finalization-wait-screen", () => ({
	FinalizationWaitScreen: () => <div data-testid="finalization-wait" />,
}));

vi.mock("@/components/results/EvidencePanel", () => ({
	EvidencePanel: () => <div data-testid="evidence-panel" />,
}));

vi.mock("@/components/sharing/archetype-share-card", () => ({
	ArchetypeShareCard: () => <div data-testid="archetype-share-card" />,
}));

vi.mock("@/components/results/PortraitReadingView", () => ({
	PortraitReadingView: () => <div data-testid="portrait-reading" />,
}));

vi.mock("@/components/results/PortraitGeneratingState", () => ({
	PortraitGeneratingState: () => <div data-testid="portrait-generating-state" />,
}));

// Static import — all heavy deps are mocked above (vi.mock is hoisted)
import { Route } from "./me/$conversationSessionId";

const Component = Route.component as React.ComponentType;

describe("me/$conversationSessionId route behavior (session-scoped identity + portrait)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
		mockFetchFirstVisitState.mockResolvedValue({ firstVisitCompleted: true });
		mockCompleteFirstVisit.mockResolvedValue({ firstVisitCompleted: true });
		mockScheduleFirstDailyPrompt.mockResolvedValue({
			success: true,
			scheduledFor: "2026-04-15T19:00:00.000Z",
		});
		mockSyncPushSubscription.mockResolvedValue({ status: "saved" });
		mockUseGetResults.mockReturnValue({
			data: null,
			isLoading: false,
			error: null,
		});
		mockUseSubscriptionQuery.mockReturnValue({
			data: {
				subscriptionStatus: "none" as const,
				isEntitledToConversationExtension: false,
				subscribedSince: null,
			},
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		mockUseActivateExtension.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			isError: false,
		});
	});

	it("shows auth gate and disables results query for unauthenticated users", () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isPending: false });

		render(<Component />);

		expect(screen.getByTestId("mock-auth-gate")).toBeTruthy();
		expect(mockUseGetResults).toHaveBeenCalledWith("session-123", false);
	});

	it("bypasses gate and enables results query for authenticated users", () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockUseGetResults.mockReturnValue({
			data: {
				archetypeName: "Navigator",
				oceanCode5: "OCEAV",
				archetypeDescription: "Description",
				overallConfidence: 0.78,
				isCurated: true,
				traits: [{ name: "openness", score: 60, level: "O", confidence: 0.8 }],
				facets: [{ name: "intellect", traitName: "openness", score: 60, confidence: 0.8 }],
				archetypeColor: "#000",
				oceanCode4: "OCEA",
				messageCount: 24,
			},
			isLoading: false,
			error: null,
		});

		render(<Component />);

		expect(screen.queryByTestId("mock-auth-gate")).toBeNull();
		expect(screen.getByTestId("results-content")).toBeTruthy();
		expect(mockUseGetResults).toHaveBeenCalledWith("session-123", true);
		expect(screen.queryByTestId("results-continue-chat")).toBeNull();
	});

	it("adds labeled regions for the lower results-page sections", () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockUseGetResults.mockReturnValue({
			data: {
				archetypeName: "Navigator",
				oceanCode5: "OCEAV",
				archetypeDescription: "Description",
				overallConfidence: 0.78,
				isCurated: true,
				traits: [{ name: "openness", score: 60, level: "O", confidence: 0.8 }],
				facets: [{ name: "intellect", traitName: "openness", score: 60, confidence: 0.8 }],
				archetypeColor: "#000",
				oceanCode4: "OCEA",
				messageCount: 24,
				publicProfileId: "public-123",
				shareableUrl: "https://example.com/profile/public-123",
				isPublic: true,
			},
			isLoading: false,
			error: null,
		});

		render(<Component />);

		expect(screen.getByRole("region", { name: "Share your profile" })).toContainElement(
			screen.getByTestId("share-section"),
		);
		expect(screen.getByRole("region", { name: "Relationship comparison" })).toContainElement(
			screen.getByTestId("relationship-card"),
		);
		expect(screen.getByRole("region", { name: "Relationship letters" })).toContainElement(
			screen.getByTestId("relationship-analyses-list"),
		);
	});

	it("renders the return seed on the first full results visit and consumes the server flag", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockFetchFirstVisitState.mockResolvedValue({ firstVisitCompleted: false });
		mockUseGetResults.mockReturnValue({
			data: {
				...resultsData,
				publicProfileId: "public-123",
				shareableUrl: "https://example.com/profile/public-123",
				isPublic: true,
			},
			isLoading: false,
			error: null,
		});

		render(<Component />);

		expect(await screen.findByTestId("return-seed-card")).toBeInTheDocument();
		await waitFor(() => {
			expect(mockCompleteFirstVisit).toHaveBeenCalledTimes(1);
		});
	});

	it("hides the return seed on subsequent visits", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockFetchFirstVisitState.mockResolvedValue({ firstVisitCompleted: true });
		mockUseGetResults.mockReturnValue({
			data: resultsData,
			isLoading: false,
			error: null,
		});

		render(<Component />);

		await waitFor(() => {
			expect(mockFetchFirstVisitState).toHaveBeenCalledTimes(1);
		});
		expect(screen.queryByTestId("return-seed-card")).toBeNull();
		expect(mockCompleteFirstVisit).not.toHaveBeenCalled();
	});

	it("triggers notification permission and scheduling only from the accept path", async () => {
		const requestPermission = vi.fn().mockResolvedValue("granted");
		Object.defineProperty(window, "Notification", {
			configurable: true,
			value: {
				permission: "default",
				requestPermission,
			},
		});

		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockFetchFirstVisitState.mockResolvedValue({ firstVisitCompleted: false });
		mockUseGetResults.mockReturnValue({
			data: resultsData,
			isLoading: false,
			error: null,
		});
		const expectedSchedule = new Date();
		expectedSchedule.setDate(expectedSchedule.getDate() + 1);
		expectedSchedule.setHours(19, 0, 0, 0);

		render(<Component />);

		fireEvent.click(await screen.findByTestId("return-seed-accept"));

		await waitFor(() => {
			expect(requestPermission).toHaveBeenCalledTimes(1);
		});
		await waitFor(() => {
			expect(mockSyncPushSubscription).toHaveBeenCalledWith({ respectSessionCache: false });
		});
		expect(mockScheduleFirstDailyPrompt).toHaveBeenCalledWith({
			scheduledFor: expectedSchedule.toISOString(),
		});
	});

	it("keeps the decline path graceful without opening the browser prompt", async () => {
		const requestPermission = vi.fn();
		Object.defineProperty(window, "Notification", {
			configurable: true,
			value: {
				permission: "default",
				requestPermission,
			},
		});

		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockFetchFirstVisitState.mockResolvedValue({ firstVisitCompleted: false });
		mockUseGetResults.mockReturnValue({
			data: resultsData,
			isLoading: false,
			error: null,
		});

		render(<Component />);

		fireEvent.click(await screen.findByTestId("return-seed-decline"));

		expect(requestPermission).not.toHaveBeenCalled();
		expect(screen.getByTestId("return-seed-feedback")).toHaveTextContent(
			"That's alright. Come back tomorrow when it feels right.",
		);
	});

	it("does not render results content on 404 error", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockUseGetResults.mockReturnValue({
			data: null,
			isLoading: false,
			error: { status: 404, message: "Session not found" },
		});

		render(<Component />);

		expect(screen.queryByText("Continue Assessment")).toBeNull();
	});

	it("shows results extension CTA when entitled and results are the latest version", () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockUseSubscriptionQuery.mockReturnValue({
			data: {
				subscriptionStatus: "active" as const,
				isEntitledToConversationExtension: true,
				subscribedSince: "2025-01-01T00:00:00.000Z",
			},
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		mockUseGetResults.mockReturnValue({
			data: { ...resultsData, isLatestVersion: true },
			isLoading: false,
			error: null,
		});

		render(<Component />);

		expect(screen.getByTestId("results-extend-conversation-strip")).toBeTruthy();
		expect(screen.getByTestId("results-extend-conversation-cta")).toBeTruthy();
	});

	it("does not show results extension CTA when results are not the latest version", () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockUseSubscriptionQuery.mockReturnValue({
			data: {
				subscriptionStatus: "active" as const,
				isEntitledToConversationExtension: true,
				subscribedSince: "2025-01-01T00:00:00.000Z",
			},
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		mockUseGetResults.mockReturnValue({
			data: { ...resultsData, isLatestVersion: false },
			isLoading: false,
			error: null,
		});

		render(<Component />);

		expect(screen.queryByTestId("results-extend-conversation-cta")).toBeNull();
	});

	it("disables results extension CTA while activateExtension is pending", () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockUseSubscriptionQuery.mockReturnValue({
			data: {
				subscriptionStatus: "active" as const,
				isEntitledToConversationExtension: true,
				subscribedSince: "2025-01-01T00:00:00.000Z",
			},
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		mockUseActivateExtension.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: true,
			isError: false,
		});
		mockUseGetResults.mockReturnValue({
			data: { ...resultsData, isLatestVersion: true },
			isLoading: false,
			error: null,
		});

		render(<Component />);

		expect(screen.getByTestId("results-extend-conversation-cta")).toBeDisabled();
	});
});

const resultsData = {
	archetypeName: "Navigator",
	oceanCode5: "OCEAV",
	archetypeDescription: "Description",
	overallConfidence: 0.78,
	isCurated: true,
	traits: [{ name: "openness" as const, score: 60, level: "O", confidence: 0.8 }],
	facets: [
		{ name: "intellect" as const, traitName: "openness" as const, score: 60, confidence: 0.8 },
	],
	archetypeColor: "#000",
	oceanCode4: "OCEA",
	messageCount: 24,
};

function setupAuthenticatedWithResults() {
	mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
	mockUseGetResults.mockReturnValue({ data: resultsData, isLoading: false, error: null });
}

describe("Story 2.2: Portrait generating state and fade-in transition", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
		mockUseGetResults.mockReturnValue({ data: null, isLoading: false, error: null });
		mockUsePortraitStatus.mockReturnValue({ data: null, isError: false, refetch: vi.fn() });
		mockUseSubscriptionQuery.mockReturnValue({
			data: {
				subscriptionStatus: "none" as const,
				isEntitledToConversationExtension: false,
				subscribedSince: null,
			},
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		mockUseActivateExtension.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			isError: false,
		});
	});

	it("shows generating state when portrait is generating", () => {
		setupAuthenticatedWithResults();
		mockUseSearch.mockReturnValue({ view: "portrait" });
		mockUsePortraitStatus.mockReturnValue({
			data: { status: "generating", portrait: null },
			isError: false,
			refetch: vi.fn(),
		});

		render(<Component />);

		expect(screen.getByTestId("portrait-generating-state")).toBeTruthy();
		expect(screen.queryByTestId("portrait-reading")).toBeNull();
	});

	it("shows reading view when portrait is ready with content", () => {
		setupAuthenticatedWithResults();
		mockUseSearch.mockReturnValue({ view: "portrait" });
		mockUsePortraitStatus.mockReturnValue({
			data: { status: "ready", portrait: { content: "Your portrait letter..." } },
			isError: false,
			refetch: vi.fn(),
		});

		render(<Component />);

		expect(screen.getByTestId("portrait-reading")).toBeTruthy();
		expect(screen.queryByTestId("portrait-generating-state")).toBeNull();
	});

	it("applies fade-in animation class when transitioning from generating to ready", () => {
		setupAuthenticatedWithResults();
		mockUseSearch.mockReturnValue({ view: "portrait" });
		mockUsePortraitStatus.mockReturnValue({
			data: { status: "generating", portrait: null },
			isError: false,
			refetch: vi.fn(),
		});

		const { rerender } = render(<Component />);
		expect(screen.getByTestId("portrait-generating-state")).toBeTruthy();

		// Transition to ready
		mockUsePortraitStatus.mockReturnValue({
			data: { status: "ready", portrait: { content: "Your portrait letter..." } },
			isError: false,
			refetch: vi.fn(),
		});

		rerender(<Component />);

		const readingWrapper = screen.getByTestId("portrait-reading").parentElement;
		expect(readingWrapper?.className).toContain("motion-safe:animate-in");
		expect(readingWrapper?.className).toContain("motion-safe:fade-in-0");
	});

	it("does not apply fade-in animation when portrait is already ready on mount", () => {
		setupAuthenticatedWithResults();
		mockUseSearch.mockReturnValue({ view: "portrait" });
		mockUsePortraitStatus.mockReturnValue({
			data: { status: "ready", portrait: { content: "Your portrait letter..." } },
			isError: false,
			refetch: vi.fn(),
		});

		render(<Component />);

		const readingWrapper = screen.getByTestId("portrait-reading").parentElement;
		expect(readingWrapper?.className ?? "").not.toContain("animate-in");
	});

	it("uses motion-safe prefix for reduced motion fallback", () => {
		setupAuthenticatedWithResults();
		mockUseSearch.mockReturnValue({ view: "portrait" });
		mockUsePortraitStatus.mockReturnValue({
			data: { status: "generating", portrait: null },
			isError: false,
			refetch: vi.fn(),
		});

		const { rerender } = render(<Component />);

		mockUsePortraitStatus.mockReturnValue({
			data: { status: "ready", portrait: { content: "Your portrait letter..." } },
			isError: false,
			refetch: vi.fn(),
		});

		rerender(<Component />);

		const readingWrapper = screen.getByTestId("portrait-reading").parentElement;
		const className = readingWrapper?.className ?? "";
		// All animation classes must be gated by motion-safe: prefix
		expect(className).toContain("motion-safe:animate-in");
		expect(className).toContain("motion-safe:fade-in-0");
		expect(className).toContain("motion-safe:slide-in-from-bottom-2");
		expect(className).toContain("motion-safe:duration-500");
	});

	it("falls through to profile view when portrait status is 'none'", () => {
		setupAuthenticatedWithResults();
		mockUseSearch.mockReturnValue({ view: "portrait" });
		mockUsePortraitStatus.mockReturnValue({
			data: { status: "none", portrait: null },
			isError: false,
			refetch: vi.fn(),
		});

		render(<Component />);

		expect(screen.queryByTestId("portrait-generating-state")).toBeNull();
		expect(screen.getByTestId("results-content")).toBeTruthy();
	});

	it("falls through to profile view when portrait status query errors", () => {
		setupAuthenticatedWithResults();
		mockUseSearch.mockReturnValue({ view: "portrait" });
		mockUsePortraitStatus.mockReturnValue({
			data: null,
			isError: true,
			refetch: vi.fn(),
		});

		render(<Component />);

		expect(screen.queryByTestId("portrait-generating-state")).toBeNull();
		expect(screen.getByTestId("results-content")).toBeTruthy();
	});
});
