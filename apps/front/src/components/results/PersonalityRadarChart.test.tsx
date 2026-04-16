// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { TraitResult } from "@workspace/domain";
import { beforeAll, describe, expect, it } from "vitest";
import { PersonalityRadarChart } from "./PersonalityRadarChart";

// Recharts ResponsiveContainer requires ResizeObserver
beforeAll(() => {
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
});

const mockTraits: TraitResult[] = [
	{ name: "openness", score: 90, level: "O", confidence: 0.85 },
	{ name: "conscientiousness", score: 60, level: "B", confidence: 0.7 },
	{ name: "extraversion", score: 40, level: "E", confidence: 0.65 },
	{ name: "agreeableness", score: 80, level: "W", confidence: 0.75 },
	{ name: "neuroticism", score: 30, level: "C", confidence: 0.6 },
];

describe("PersonalityRadarChart", () => {
	it("renders the chart container with data-slot", () => {
		const { container } = render(<PersonalityRadarChart traits={mockTraits} />);
		const chart = container.querySelector('[data-slot="personality-radar-chart"]');
		expect(chart).toBeInTheDocument();
	});

	it("renders the card title", () => {
		render(<PersonalityRadarChart traits={mockTraits} />);
		expect(screen.getByText("Personality Shape")).toBeInTheDocument();
	});

	it("standalone mode wraps the chart with role=img and the sr-only trait table", () => {
		const { container } = render(<PersonalityRadarChart traits={mockTraits} standalone />);
		expect(container.querySelector('[data-slot="personality-radar-chart"]')).toBeInTheDocument();
		expect(
			screen.getByRole("img", {
				name: /personality radar chart for this profile\. highest trait: openness \(90 of 120\)\./i,
			}),
		).toBeInTheDocument();
		expect(screen.getByRole("table", { name: /trait scores/i })).toBeInTheDocument();
	});

	it("has role='img' and aria-label on the chart visual container", () => {
		render(<PersonalityRadarChart traits={mockTraits} />);
		const imgEl = screen.getByRole("img", {
			name: /personality radar chart for this profile\. highest trait: openness \(90 of 120\)\./i,
		});
		expect(imgEl).toBeInTheDocument();
	});

	it("renders a visually hidden data table with trait scores for screen readers", () => {
		render(<PersonalityRadarChart traits={mockTraits} />);
		const table = screen.getByRole("table", { name: /trait scores/i });
		expect(table).toBeInTheDocument();

		// Check that all trait names appear in the table
		const rows = screen.getAllByRole("row");
		// 1 header row + 5 data rows
		expect(rows.length).toBe(6);

		// Check specific trait data
		expect(screen.getByText("90 / 120")).toBeInTheDocument();
		expect(screen.getByText("60 / 120")).toBeInTheDocument();
	});

	// Note: Recharts RadarChart internal components (Radar shape, dots) require actual DOM dimensions
	// to compute polar coordinates. jsdom renders at 0x0 so these callbacks are never invoked.
	// The multi-color shape rendering (5 path slices + 5 line strokes) is verified via manual
	// visual testing with `pnpm dev --filter=front`. See tech-spec Task 5 for visual verification steps.
});
