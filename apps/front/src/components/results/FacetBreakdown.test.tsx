import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FacetBreakdown } from "./FacetBreakdown";

const defaultFacets = [
	{ name: "Imagination", score: 17, confidence: 88 },
	{ name: "Artistic Interests", score: 16, confidence: 75 },
	{ name: "Emotionality", score: 14, confidence: 82 },
	{ name: "Adventurousness", score: 13, confidence: 70 },
	{ name: "Intellect", score: 15, confidence: 90 },
	{ name: "Liberalism", score: 10, confidence: 65 },
];

const defaultProps = {
	traitName: "openness",
	facets: defaultFacets,
	traitScore: 85,
	id: "facets-openness",
};

describe("FacetBreakdown", () => {
	it("renders all 6 facets", () => {
		render(<FacetBreakdown {...defaultProps} />);
		const list = screen.getByTestId("facet-list");
		expect(list.querySelectorAll("li")).toHaveLength(6);
	});

	it("renders facet names", () => {
		render(<FacetBreakdown {...defaultProps} />);
		expect(screen.getByText("Imagination")).toBeInTheDocument();
		expect(screen.getByText("Artistic Interests")).toBeInTheDocument();
		expect(screen.getByText("Liberalism")).toBeInTheDocument();
	});

	it("renders facet scores as fraction of 20", () => {
		render(<FacetBreakdown {...defaultProps} />);
		expect(screen.getByText("17/20")).toBeInTheDocument();
		expect(screen.getByText("10/20")).toBeInTheDocument();
	});

	it("renders facet confidence percentages", () => {
		render(<FacetBreakdown {...defaultProps} />);
		expect(screen.getByTestId("facet-confidence-Imagination")).toHaveTextContent("88%");
		expect(screen.getByTestId("facet-confidence-Liberalism")).toHaveTextContent("65%");
	});

	it("renders sum visualization with trait score", () => {
		render(<FacetBreakdown {...defaultProps} />);
		expect(screen.getByTestId("facet-sum-label")).toHaveTextContent(
			"6 facets sum to Openness trait score (85/120)",
		);
	});

	it("highlights high-scoring facets (>= 15) with star", () => {
		render(<FacetBreakdown {...defaultProps} />);
		// Imagination (17), Artistic Interests (16), Intellect (15) should have highlight
		expect(screen.getByTestId("facet-highlight-Imagination")).toBeInTheDocument();
		expect(screen.getByTestId("facet-highlight-Artistic Interests")).toBeInTheDocument();
		expect(screen.getByTestId("facet-highlight-Intellect")).toBeInTheDocument();
		// Emotionality (14), Adventurousness (13), Liberalism (10) should NOT
		expect(screen.queryByTestId("facet-highlight-Emotionality")).not.toBeInTheDocument();
		expect(screen.queryByTestId("facet-highlight-Adventurousness")).not.toBeInTheDocument();
		expect(screen.queryByTestId("facet-highlight-Liberalism")).not.toBeInTheDocument();
	});

	it("applies muted opacity to low-confidence facets (< 30%)", () => {
		const facetsWithLow = [
			{ name: "Imagination", score: 10, confidence: 88 },
			{ name: "Artistic Interests", score: 10, confidence: 15 },
			{ name: "Emotionality", score: 10, confidence: 50 },
			{ name: "Adventurousness", score: 10, confidence: 5 },
			{ name: "Intellect", score: 10, confidence: 70 },
			{ name: "Liberalism", score: 10, confidence: 29 },
		];

		render(<FacetBreakdown {...defaultProps} facets={facetsWithLow} />);

		// Low confidence items should have opacity-60
		const lowItem = screen.getByTestId("facet-item-Artistic Interests");
		expect(lowItem).toHaveClass("opacity-60");

		const normalItem = screen.getByTestId("facet-item-Imagination");
		expect(normalItem).not.toHaveClass("opacity-60");
	});

	it("renders disabled View Evidence buttons", () => {
		render(<FacetBreakdown {...defaultProps} />);
		const buttons = screen.getAllByText("View Evidence");
		expect(buttons).toHaveLength(6);
		for (const btn of buttons) {
			expect(btn).toBeDisabled();
		}
	});

	it("has correct ARIA attributes", () => {
		render(<FacetBreakdown {...defaultProps} />);
		const section = screen.getByTestId("facet-breakdown-openness");
		// <section> element has implicit role="region"
		expect(section.tagName).toBe("SECTION");
		expect(section).toHaveAttribute("aria-label", "openness facet breakdown");
		expect(section).toHaveAttribute("id", "facets-openness");

		const list = screen.getByTestId("facet-list");
		expect(list.tagName).toBe("UL");
	});

	it("renders facet items with ARIA labels", () => {
		render(<FacetBreakdown {...defaultProps} />);
		const item = screen.getByTestId("facet-item-Imagination");
		expect(item).toHaveAttribute("aria-label", "Imagination: 17 out of 20, 88% confidence");
	});
});
