// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseParams, mockUseSearch, mockNavigate, mockUseAuth, mockUseGetResults } = vi.hoisted(
	() => ({
		mockUseParams: vi.fn(() => ({ conversationSessionId: "session-123" })),
		mockUseSearch: vi.fn(() => ({ scrollToFacet: undefined })),
		mockNavigate: vi.fn(),
		mockUseAuth: vi.fn(),
		mockUseGetResults: vi.fn(),
	}),
);

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
	usePortraitStatus: () => ({ data: null, refetch: vi.fn() }),
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

vi.mock("@/components/results/QuickActionsCard", () => ({
	QuickActionsCard: () => <div data-testid="quick-actions" />,
}));

vi.mock("@/components/results/RelationshipCreditsSection", () => ({
	RelationshipCreditsSection: () => (
		<section data-testid="relationship-credits-section" aria-label="Relationship credits" />
	),
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

vi.mock("@workspace/ui/hooks/use-theme", () => ({
	useTheme: () => ({ userTheme: "system", appTheme: "light", setTheme: vi.fn() }),
	ThemeContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

vi.mock("@/lib/polar-checkout", () => ({
	createThemedCheckoutEmbed: vi.fn(),
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
		expect(screen.getByRole("region", { name: "Relationship credits" })).toContainElement(
			screen.getByTestId("relationship-credits-section"),
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
