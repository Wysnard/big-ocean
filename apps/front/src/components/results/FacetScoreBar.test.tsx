// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { FacetResult } from "@workspace/domain";
import { describe, expect, it } from "vitest";
import { FacetScoreBar } from "./FacetScoreBar";

const mockFacet: FacetResult = {
	name: "imagination",
	traitName: "openness",
	score: 15,
	confidence: 0.8,
};

describe("FacetScoreBar", () => {
	it("renders facet name and score", () => {
		render(<FacetScoreBar facet={mockFacet} />);
		expect(screen.getByText("Imagination")).toBeInTheDocument();
		expect(screen.getByText("15")).toBeInTheDocument();
	});

	it("accepts staggerIndex prop and applies animation delay", () => {
		const { container } = render(<FacetScoreBar facet={mockFacet} staggerIndex={2} />);
		const bar = container.querySelector("[data-slot='facet-score-bar']");
		expect(bar).toBeInTheDocument();
		// staggerIndex 2 * 50ms = 100ms delay
		expect(bar?.getAttribute("style")).toContain("animation-delay");
	});

	it("has role='progressbar' with aria attributes on the bar", () => {
		const { container } = render(<FacetScoreBar facet={mockFacet} />);
		const progressbar = container.querySelector("[role='progressbar']");
		expect(progressbar).toBeInTheDocument();
		expect(progressbar).toHaveAttribute("aria-valuenow", "15");
		expect(progressbar).toHaveAttribute("aria-valuemin", "0");
		expect(progressbar).toHaveAttribute("aria-valuemax", "20");
		expect(progressbar).toHaveAttribute("aria-label", "Imagination: 15 out of 20");
	});
});
