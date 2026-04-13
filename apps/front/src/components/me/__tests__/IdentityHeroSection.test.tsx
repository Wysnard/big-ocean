// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { GetResultsResponse } from "@workspace/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	mockArchetypeHeroSection,
	mockOceanCodeStrand,
	mockPersonalityRadarChart,
	mockConfidenceRingCard,
} = vi.hoisted(() => ({
	mockArchetypeHeroSection: vi.fn(),
	mockOceanCodeStrand: vi.fn(),
	mockPersonalityRadarChart: vi.fn(),
	mockConfidenceRingCard: vi.fn(),
}));

// Mock all child components that contain Recharts / Radix Tooltip.
// IdentityHeroSection is a composition component — we test that the right
// sub-components are rendered with the right props, not their internal rendering.
vi.mock("@/components/results/ArchetypeHeroSection", () => ({
	ArchetypeHeroSection: (props: {
		archetypeName: string;
		oceanCode5: string;
		dominantTrait: string;
		overallConfidence: number;
	}) => {
		mockArchetypeHeroSection(props);
		return (
			<section data-testid="archetype-hero-section">
				<h1 data-testid="archetype-name">{props.archetypeName}</h1>
				<div data-testid="ocean-code">{props.oceanCode5}</div>
			</section>
		);
	},
}));

vi.mock("@/components/results/OceanCodeStrand", () => ({
	OceanCodeStrand: (props: { oceanCode5: string }) => {
		mockOceanCodeStrand(props);
		return <div data-slot="ocean-code-strand" />;
	},
}));

vi.mock("@/components/results/PersonalityRadarChart", () => ({
	PersonalityRadarChart: (props: { traits: GetResultsResponse["traits"] }) => {
		mockPersonalityRadarChart(props);
		return <div data-slot="personality-radar-chart" />;
	},
}));

vi.mock("@/components/results/ConfidenceRingCard", () => ({
	ConfidenceRingCard: (props: { confidence: number; messageCount: number }) => {
		mockConfidenceRingCard(props);
		return <div data-slot="confidence-ring-card" />;
	},
}));

import { IdentityHeroSection } from "../IdentityHeroSection";

// OCEAR = Open-minded / Conscientious / Extravert / Agreeable / Resilient — valid hieroglyph pattern
const mockResults: GetResultsResponse = {
	oceanCode5: "OCEAR" as GetResultsResponse["oceanCode5"],
	oceanCode4: "OCEA" as GetResultsResponse["oceanCode4"],
	archetypeName: "The Deep Current",
	archetypeDescription: "A calm, observant presence with depth.",
	archetypeColor: "#3B82F6",
	isCurated: true,
	traits: [
		{ name: "openness", score: 90, level: "O", confidence: 85 },
		{ name: "conscientiousness", score: 65, level: "S", confidence: 70 },
		{ name: "extraversion", score: 40, level: "I", confidence: 75 },
		{ name: "agreeableness", score: 80, level: "A", confidence: 80 },
		{ name: "neuroticism", score: 30, level: "R", confidence: 65 },
	],
	facets: [],
	overallConfidence: 75, // 0-100 scale from the API
	messageCount: 24,
	publicProfileId: null,
	shareableUrl: null,
	isPublic: false,
	isLatestVersion: true,
};

describe("IdentityHeroSection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the archetype name via ArchetypeHeroSection", () => {
		render(<IdentityHeroSection results={mockResults} />);
		const archetypeNameEl = screen.getByTestId("archetype-name");
		expect(archetypeNameEl).toBeInTheDocument();
		expect(archetypeNameEl).toHaveTextContent("The Deep Current");
	});

	it("renders the ArchetypeHeroSection container (data-testid)", () => {
		render(<IdentityHeroSection results={mockResults} />);
		expect(screen.getByTestId("archetype-hero-section")).toBeInTheDocument();
	});

	it("renders OceanCodeStrand via data-slot", () => {
		const { container } = render(<IdentityHeroSection results={mockResults} />);
		expect(container.querySelector('[data-slot="ocean-code-strand"]')).toBeInTheDocument();
	});

	it("renders PersonalityRadarChart via data-slot", () => {
		const { container } = render(<IdentityHeroSection results={mockResults} />);
		expect(container.querySelector('[data-slot="personality-radar-chart"]')).toBeInTheDocument();
	});

	it("renders ConfidenceRingCard via data-slot", () => {
		const { container } = render(<IdentityHeroSection results={mockResults} />);
		expect(container.querySelector('[data-slot="confidence-ring-card"]')).toBeInTheDocument();
	});

	it("derives the dominant trait and normalises confidence before passing props down", () => {
		render(<IdentityHeroSection results={mockResults} />);

		expect(mockArchetypeHeroSection).toHaveBeenCalledWith(
			expect.objectContaining({
				archetypeName: "The Deep Current",
				oceanCode5: "OCEAR",
				dominantTrait: "openness",
				overallConfidence: 0.75,
			}),
		);
		expect(mockOceanCodeStrand).toHaveBeenCalledWith({ oceanCode5: "OCEAR" });
		expect(mockPersonalityRadarChart).toHaveBeenCalledWith({ traits: mockResults.traits });
		expect(mockConfidenceRingCard).toHaveBeenCalledWith({
			confidence: 0.75,
			messageCount: 24,
		});
	});

	it("does not call any data-fetching hooks — accepts results as a prop only", () => {
		// IdentityHeroSection should not call useGetResults or any other hook.
		// Rendering without QueryClientProvider or any provider confirms this:
		// if a hook were called, React would throw a context error before this passes.
		expect(() => render(<IdentityHeroSection results={mockResults} />)).not.toThrow();
	});
});
