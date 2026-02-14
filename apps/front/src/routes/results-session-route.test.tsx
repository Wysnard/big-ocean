// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseParams = vi.fn(() => ({ sessionId: "session-123" }));
const mockUseSearch = vi.fn(() => ({ scrollToFacet: undefined }));
const mockNavigate = vi.fn();

const mockUseAuth = vi.fn();
const mockUseGetResults = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: Record<string, unknown>) => ({
		...options,
		useParams: mockUseParams,
		useSearch: mockUseSearch,
	}),
	useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/use-assessment", () => ({
	useGetResults: (...args: unknown[]) => mockUseGetResults(...args),
	isAssessmentApiError: (error: unknown) =>
		typeof error === "object" && error !== null && "status" in error,
}));

vi.mock("@/hooks/use-evidence", () => ({
	useFacetEvidence: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/use-profile", () => ({
	useShareProfile: () => ({ isPending: false, mutateAsync: vi.fn() }),
	useToggleVisibility: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/components/ResultsAuthGate", () => ({
	ResultsAuthGate: () => <div data-testid="mock-auth-gate">Mock Auth Gate</div>,
}));

vi.mock("@/components/EvidencePanel", () => ({
	EvidencePanel: () => null,
}));

vi.mock("@/components/home/WaveDivider", () => ({
	WaveDivider: () => <div data-testid="wave-divider" />,
}));

vi.mock("@/components/results/ArchetypeHeroSection", () => ({
	ArchetypeHeroSection: () => <div data-testid="results-content" />,
}));

vi.mock("@/components/results/ShareProfileSection", () => ({
	ShareProfileSection: () => <div data-testid="share-section" />,
}));

vi.mock("@/components/results/TraitScoresSection", () => ({
	TraitScoresSection: () => <div data-testid="trait-scores-section" />,
}));

describe("results/$sessionId route behavior", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
		mockUseGetResults.mockReturnValue({
			data: null,
			isLoading: false,
			error: null,
		});
	});

	it("shows auth gate and disables results query for unauthenticated users", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isPending: false });

		const { Route } = await import("./results/$sessionId");
		const Component = Route.component;
		render(<Component />);

		expect(screen.getByTestId("mock-auth-gate")).toBeInTheDocument();
		expect(mockUseGetResults).toHaveBeenCalledWith("session-123", false);
	});

	it("bypasses gate and enables results query for authenticated users", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isPending: false });
		mockUseGetResults.mockReturnValue({
			data: {
				archetypeName: "Navigator",
				oceanCode5: "ODENT",
				archetypeDescription: "Description",
				overallConfidence: 78,
				isCurated: true,
				traits: [{ name: "openness", score: 60, level: "O", confidence: 80 }],
				facets: [{ name: "Ideas", traitName: "openness", score: 60, confidence: 80 }],
				archetypeColor: "#000",
				oceanCode4: "ODEN",
			},
			isLoading: false,
			error: null,
		});

		const { Route } = await import("./results/$sessionId");
		const Component = Route.component;
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

		const { Route } = await import("./results/$sessionId");
		const Component = Route.component;
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

		const { Route } = await import("./results/$sessionId");
		const Component = Route.component;
		render(<Component />);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/404" });
		});
		expect(screen.queryByText("Continue Assessment")).not.toBeInTheDocument();
	});
});
