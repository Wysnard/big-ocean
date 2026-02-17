// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { ConfidenceRingCard } from "./ConfidenceRingCard";

beforeAll(() => {
	// Recharts ResponsiveContainer requires ResizeObserver in jsdom
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
});

describe("ConfidenceRingCard", () => {
	it("renders the heading", () => {
		render(<ConfidenceRingCard confidence={82} messageCount={24} />);
		expect(screen.getByText("Overall Confidence")).toBeInTheDocument();
	});

	it("renders the message count label", () => {
		render(<ConfidenceRingCard confidence={82} messageCount={24} />);
		expect(screen.getByText("Based on 24 conversation messages")).toBeInTheDocument();
	});

	it("has data-slot attribute", () => {
		const { container } = render(<ConfidenceRingCard confidence={82} messageCount={24} />);
		expect(container.querySelector("[data-slot='confidence-ring-card']")).toBeInTheDocument();
	});
});
