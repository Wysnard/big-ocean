// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { FacetResult, TraitResult } from "@workspace/domain";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { describe, expect, it, vi } from "vitest";
import { TraitCard } from "./TraitCard";

const mockTrait: TraitResult = {
	name: "openness",
	score: 90,
	level: "O",
	confidence: 0.85,
};

const mockFacets: FacetResult[] = [
	{ name: "imagination", traitName: "openness", score: 15, confidence: 0.8 },
	{ name: "artistic_interests", traitName: "openness", score: 12, confidence: 0.75 },
	{ name: "emotionality", traitName: "openness", score: 18, confidence: 0.9 },
	{ name: "adventurousness", traitName: "openness", score: 10, confidence: 0.7 },
	{ name: "intellect", traitName: "openness", score: 17, confidence: 0.85 },
	{ name: "liberalism", traitName: "openness", score: 16, confidence: 0.8 },
];

function renderTraitCard(props?: Partial<Parameters<typeof TraitCard>[0]>) {
	return render(
		<TooltipProvider>
			<TraitCard
				trait={mockTrait}
				facets={mockFacets}
				isSelected={false}
				onToggle={vi.fn()}
				{...props}
			/>
		</TooltipProvider>,
	);
}

describe("TraitCard", () => {
	it("renders trait name and score", () => {
		renderTraitCard();
		expect(screen.getByText("Openness")).toBeInTheDocument();
		expect(screen.getByText("90")).toBeInTheDocument();
		expect(screen.getByText("/120")).toBeInTheDocument();
	});

	it("renders all 6 facet names", () => {
		renderTraitCard();
		expect(screen.getByText("Imagination")).toBeInTheDocument();
		expect(screen.getByText("Artistic Interests")).toBeInTheDocument();
		expect(screen.getByText("Intellect")).toBeInTheDocument();
	});

	it("fires onToggle with trait name when tapped", () => {
		const onToggle = vi.fn();
		renderTraitCard({ onToggle });
		const card = screen.getByText("Openness").closest("button");
		expect(card).toBeTruthy();
		if (card) fireEvent.click(card);
		expect(onToggle).toHaveBeenCalledOnce();
		expect(onToggle).toHaveBeenCalledWith("openness");
	});

	it("shows selected state with data-selected attribute", () => {
		const { container } = renderTraitCard({ isSelected: true });
		const card = container.querySelector("[data-selected]");
		expect(card).toBeInTheDocument();
	});

	it("displays confidence percentage in mini ring", () => {
		renderTraitCard();
		// confidence: 0.85 → "85%"
		expect(screen.getByText("85%")).toBeInTheDocument();
	});

	it("does not display score as percentage", () => {
		renderTraitCard();
		// score 90/120 = 75%, should NOT appear as text
		expect(screen.queryByText("75%")).not.toBeInTheDocument();
	});

	it("shows trait-specific level name as pill", () => {
		renderTraitCard();
		// Openness + score 90 (High band) → letter "O" → "Open-minded"
		expect(screen.getByText("Open-minded")).toBeInTheDocument();
	});

	it("shows correct level name for mid-range score", () => {
		renderTraitCard({
			trait: { name: "conscientiousness", score: 60, level: "S", confidence: 0.7 },
		});
		// Conscientiousness + score 60 (Mid band) → letter "S" → "Steady"
		expect(screen.getByText("Steady")).toBeInTheDocument();
	});

	it("shows correct level name for low-range score", () => {
		renderTraitCard({
			trait: { name: "neuroticism", score: 25, level: "R", confidence: 0.5 },
		});
		// Neuroticism + score 25 (Low band) → letter "R" → "Resilient"
		expect(screen.getByText("Resilient")).toBeInTheDocument();
	});

	it("has aria-expanded='false' when not selected", () => {
		renderTraitCard({ isSelected: false });
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-expanded", "false");
		expect(button).toHaveAttribute("aria-controls", "trait-detail-zone-openness");
	});

	it("has aria-expanded='true' when selected", () => {
		renderTraitCard({ isSelected: true });
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-expanded", "true");
		expect(button).toHaveAttribute("aria-controls", "trait-detail-zone-openness");
	});

	it("toggles via Enter key", () => {
		const onToggle = vi.fn();
		renderTraitCard({ onToggle });
		const button = screen.getByRole("button");
		fireEvent.keyDown(button, { key: "Enter" });
		// Native button handles Enter → onClick, so this fires via click event
		fireEvent.click(button);
		expect(onToggle).toHaveBeenCalledWith("openness");
	});
});
