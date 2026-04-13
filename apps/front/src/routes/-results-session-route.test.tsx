// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	mockUseParams,
	mockUseSearch,
	mockNavigate,
	mockUseAuth,
	mockUseGetResults,
	mockUsePortraitStatus,
} = vi.hoisted(() => ({
	mockUseParams: vi.fn(() => ({ conversationSessionId: "session-123" })),
	mockUseSearch: vi.fn(() => ({ scrollToFacet: undefined })),
	mockNavigate: vi.fn(),
	mockUseAuth: vi.fn(),
	mockUseGetResults: vi.fn(),
	mockUsePortraitStatus: vi.fn(() => ({ data: null, isError: false, refetch: vi.fn() })),
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

vi.mock("@/hooks/use-evidence", () => ({
	useFacetEvidence: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/use-profile", () => ({
	useToggleVisibility: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/hooks/usePortraitStatus", () => ({
	usePortraitStatus: (...args: unknown[]) => mockUsePortraitStatus(...args),
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
	useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/components/ResultsAuthGate", () => ({
	ResultsAuthGate: () => <div data-testid="mock-auth-gate">Mock Auth Gate</div>,
}));

vi.mock("@/components/results/useTraitEvidence", () => ({
	useTraitEvidence: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/components/results/ProfileView", () => ({
	ProfileView: ({ children }: { children?: React.ReactNode }) => (
		<div data-testid="results-content">{children}</div>
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
		<section data-testid="relationship-analyses-list" aria-label="Relationship analyses">
			Relationship analyses
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
import { Route } from "./results/$conversationSessionId";

const Component = Route.component as React.ComponentType;

describe("results/$conversationSessionId route behavior", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
		mockUseGetResults.mockReturnValue({
			data: null,
			isLoading: false,
			error: null,
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
		expect(screen.getByRole("region", { name: "Relationship analyses" })).toContainElement(
			screen.getByTestId("relationship-analyses-list"),
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
