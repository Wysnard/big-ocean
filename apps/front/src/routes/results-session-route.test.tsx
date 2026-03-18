// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseParams, mockUseSearch, mockNavigate, mockUseAuth, mockUseGetResults } = vi.hoisted(
	() => ({
		mockUseParams: vi.fn(() => ({ assessmentSessionId: "session-123" })),
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

vi.mock("@/hooks/use-assessment", () => ({
	useGetResults: (...args: unknown[]) => mockUseGetResults(...args),
	getResultsQueryOptions: (sessionId: string) => ({
		queryKey: ["assessment", "results", sessionId],
		queryFn: vi.fn(),
		staleTime: 5 * 60 * 1000,
	}),
	isAssessmentApiError: (error: unknown) =>
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
	ShareProfileSection: () => <div data-testid="share-section" />,
}));

vi.mock("@/components/results/DetailZone", () => ({
	DetailZone: () => <div data-testid="detail-zone" />,
}));

vi.mock("@/components/results/QuickActionsCard", () => ({
	QuickActionsCard: () => <div data-testid="quick-actions" />,
}));

vi.mock("@/components/results/RelationshipCreditsSection", () => ({
	RelationshipCreditsSection: () => <div data-testid="relationship-credits-section" />,
}));

vi.mock("@/components/relationship/RelationshipCard", () => ({
	RelationshipCard: () => null,
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
import { Route } from "./results/$assessmentSessionId";

const Component = Route.component as React.ComponentType;

describe("results/$assessmentSessionId route behavior", () => {
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

		expect(screen.getByTestId("mock-auth-gate")).toBeInTheDocument();
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

		expect(screen.queryByTestId("mock-auth-gate")).not.toBeInTheDocument();
		expect(screen.getByTestId("results-content")).toBeInTheDocument();
		expect(mockUseGetResults).toHaveBeenCalledWith("session-123", true);
	});

	it("redirects authenticated users to 404 on denied 404 access", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockUseGetResults.mockReturnValue({
			data: null,
			isLoading: false,
			error: { status: 404, message: "Session not found" },
		});

		render(<Component />);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/404" });
		});
		expect(screen.queryByText("Continue Assessment")).not.toBeInTheDocument();
	});

	it("redirects authenticated users to 404 on plain error 404 text", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockUseGetResults.mockReturnValue({
			data: null,
			isLoading: false,
			error: new Error("HTTP 404: SessionNotFound"),
		});

		render(<Component />);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/404" });
		});
		expect(screen.queryByText("Continue Assessment")).not.toBeInTheDocument();
	});
});
