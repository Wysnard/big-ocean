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
	{ name: "openness", score: 90, level: "O", confidence: 85 },
	{ name: "conscientiousness", score: 60, level: "B", confidence: 70 },
	{ name: "extraversion", score: 40, level: "E", confidence: 65 },
	{ name: "agreeableness", score: 80, level: "W", confidence: 75 },
	{ name: "neuroticism", score: 30, level: "C", confidence: 60 },
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

	// Note: Recharts RadarChart internal components (Radar shape, dots) require actual DOM dimensions
	// to compute polar coordinates. jsdom renders at 0x0 so these callbacks are never invoked.
	// The multi-color shape rendering (5 path slices + 5 line strokes) is verified via manual
	// visual testing with `pnpm dev --filter=front`. See tech-spec Task 5 for visual verification steps.
});
