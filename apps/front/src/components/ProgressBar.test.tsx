// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
	it("renders with correct width based on value prop", () => {
		const { container } = render(<ProgressBar value={45} />);

		const fillBar = container.querySelector('[data-testid="progress-fill"]');
		expect(fillBar).toHaveStyle({ width: "45%" });
	});

	it("displays percentage when showPercentage is true (default)", () => {
		render(<ProgressBar value={67} />);

		expect(screen.getByText("67%")).toBeInTheDocument();
	});

	it("hides percentage when showPercentage is false", () => {
		render(<ProgressBar value={67} showPercentage={false} />);

		expect(screen.queryByText("67%")).not.toBeInTheDocument();
	});

	it("shows Nerin-voice label 'Getting to know you...' for values 0-24%", () => {
		render(<ProgressBar value={10} />);

		expect(screen.getByText("Getting to know you...")).toBeInTheDocument();
	});

	it("shows 'Building your profile...' for values 25-49%", () => {
		render(<ProgressBar value={30} />);

		expect(screen.getByText("Building your profile...")).toBeInTheDocument();
	});

	it("shows 'Refining your personality map...' for values 50-84%", () => {
		render(<ProgressBar value={60} />);

		expect(screen.getByText("Refining your personality map...")).toBeInTheDocument();
	});

	it("shows 'Refining your personality map...' for value 75%", () => {
		render(<ProgressBar value={75} />);

		expect(screen.getByText("Refining your personality map...")).toBeInTheDocument();
	});

	it("shows 'Almost ready for results!' for values >= 85%", () => {
		render(<ProgressBar value={85} />);

		expect(screen.getByText("Almost ready for results!")).toBeInTheDocument();
	});

	it("does not show percentage when >= 85% (final message only)", () => {
		render(<ProgressBar value={90} />);

		expect(screen.getByText("Almost ready for results!")).toBeInTheDocument();
		// showPercentage default is true, but percentage hidden when clampedValue > 80
		expect(screen.queryByText("90%")).not.toBeInTheDocument();
	});

	it("applies custom label when provided", () => {
		render(<ProgressBar value={50} label="Halfway there!" />);

		expect(screen.getByText("Halfway there!")).toBeInTheDocument();
	});

	it("clamps value to 100 maximum", () => {
		const { container } = render(<ProgressBar value={150} />);

		const fillBar = container.querySelector('[data-testid="progress-fill"]');
		expect(fillBar).toHaveStyle({ width: "100%" });
	});

	it("handles value of 0", () => {
		const { container } = render(<ProgressBar value={0} />);

		const fillBar = container.querySelector('[data-testid="progress-fill"]');
		expect(fillBar).toHaveStyle({ width: "0%" });
		expect(screen.getByText("Getting to know you...")).toBeInTheDocument();
	});

	it("applies CSS transition class for animation", () => {
		const { container } = render(<ProgressBar value={45} />);

		const fillBar = container.querySelector('[data-testid="progress-fill"]');
		expect(fillBar).toHaveClass("transition-all", "duration-500", "ease-in-out");
	});

	it("applies custom className when provided", () => {
		const { container } = render(<ProgressBar value={50} className="mt-4 mb-2" />);

		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass("mt-4", "mb-2");
	});
});
