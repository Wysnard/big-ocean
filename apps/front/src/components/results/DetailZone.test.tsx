// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { TraitResult } from "@workspace/domain";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DetailZone } from "./DetailZone";

beforeAll(() => {
	// Recharts ResponsiveContainer requires ResizeObserver in jsdom
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
});

const mockTrait: TraitResult = {
	name: "openness",
	score: 90,
	level: "O",
	confidence: 0.85,
};

const mockFacetDetails = [
	{
		name: "imagination" as const,
		score: 15,
		confidence: 0.85,
		evidence: [
			{
				id: "ev-1",
				assessmentMessageId: "msg-1",
				facetName: "imagination",
				score: 15,
				confidence: 85,
				quote: "I love creating stories in my head.",
				highlightRange: { start: 0, end: 35 },
				createdAt: new Date(),
			},
		],
	},
	{
		name: "artistic_interests" as const,
		score: 12,
		confidence: 0.45,
		evidence: [],
	},
];

describe("DetailZone", () => {
	it("renders facet names when open", () => {
		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={false}
			/>,
		);
		expect(screen.getByText("Imagination")).toBeInTheDocument();
		expect(screen.getByText("Artistic Interests")).toBeInTheDocument();
	});

	it("renders evidence quotes", () => {
		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={false}
			/>,
		);
		expect(screen.getByText(/I love creating stories in my head/)).toBeInTheDocument();
	});

	it("renders signal strength badge", () => {
		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={false}
			/>,
		);
		// confidence 85 → "Strong"
		expect(screen.getByText("Strong")).toBeInTheDocument();
	});

	it("exposes facet confidence rings as labeled graphics", () => {
		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={false}
			/>,
		);
		expect(screen.getByRole("img", { name: "Facet evidence confidence: 85%" })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "Facet evidence confidence: 45%" })).toBeInTheDocument();
	});

	it("shows 'No evidence recorded' for empty facets", () => {
		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={false}
			/>,
		);
		expect(screen.getByText("No evidence recorded")).toBeInTheDocument();
	});

	it("calls onClose when X is clicked", () => {
		const onClose = vi.fn();
		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={onClose}
				isLoading={false}
			/>,
		);
		const closeButton = screen.getByLabelText("Close detail zone");
		fireEvent.click(closeButton);
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("uses a 44px minimum touch target for the close button", () => {
		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={false}
			/>,
		);
		const closeButton = screen.getByLabelText("Close detail zone");
		expect(closeButton.className).toMatch(/min-h-11/);
		expect(closeButton.className).toMatch(/min-w-11/);
	});

	it("shows loading skeletons when loading", () => {
		const { container } = render(
			<DetailZone
				trait={mockTrait}
				facetDetails={[]}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={true}
			/>,
		);
		const skeletons = container.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("shows total evidence count in header", () => {
		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={false}
			/>,
		);
		expect(screen.getByText(/1 evidence items/)).toBeInTheDocument();
	});

	it("exposes the open panel as a labeled region for the selected trait", () => {
		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={false}
			/>,
		);

		expect(screen.getByRole("region", { name: "Openness — Evidence" })).toHaveAttribute(
			"id",
			"trait-detail-zone-openness",
		);
	});

	it("supports keyboard activation for facet evidence cards", () => {
		const onFacetClick = vi.fn();

		render(
			<DetailZone
				trait={mockTrait}
				facetDetails={mockFacetDetails}
				isOpen={true}
				onClose={vi.fn()}
				isLoading={false}
				onFacetClick={onFacetClick}
			/>,
		);

		const facetButton = screen.getByRole("button", { name: /open evidence for imagination/i });
		fireEvent.keyDown(facetButton, { key: "Enter" });
		expect(onFacetClick).toHaveBeenCalledWith("imagination", facetButton);
	});
});
