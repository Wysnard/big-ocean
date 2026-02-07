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

	it("shows '% assessed' label for values 0-50%", () => {
		render(<ProgressBar value={23} />);

		expect(screen.getByText("23% assessed")).toBeInTheDocument();
	});

	it("shows '% assessed' label for values 50-80%", () => {
		render(<ProgressBar value={67} />);

		expect(screen.getByText("67% assessed")).toBeInTheDocument();
	});

	it("shows 'You're nearly there!' for values >80%", () => {
		render(<ProgressBar value={85} />);

		expect(screen.getByText("You're nearly there!")).toBeInTheDocument();
	});

	it("shows '80% assessed' at exactly 80% (boundary test)", () => {
		render(<ProgressBar value={80} />);

		// At exactly 80%, still shows percentage (threshold is >80, not >=80)
		expect(screen.getByText("80% assessed")).toBeInTheDocument();
		expect(screen.queryByText("You're nearly there!")).not.toBeInTheDocument();
	});

	it("does not show percentage when >80% (motivational message only)", () => {
		render(<ProgressBar value={90} />);

		expect(screen.getByText("You're nearly there!")).toBeInTheDocument();
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
		expect(screen.getByText("0% assessed")).toBeInTheDocument();
	});

	it("applies CSS transition class for animation", () => {
		const { container } = render(<ProgressBar value={45} />);

		const fillBar = container.querySelector('[data-testid="progress-fill"]');
		expect(fillBar).toHaveClass("transition-all", "duration-500", "ease-in-out");
	});

	it("uses dark theme styling", () => {
		const { container } = render(<ProgressBar value={50} />);

		const track = container.querySelector('[data-testid="progress-track"]');
		expect(track).toHaveClass("bg-slate-700");

		const fillBar = container.querySelector('[data-testid="progress-fill"]');
		expect(fillBar).toHaveClass("bg-gradient-to-r", "from-blue-500", "to-purple-500");
	});

	it("applies custom className when provided", () => {
		const { container } = render(<ProgressBar value={50} className="mt-4 mb-2" />);

		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass("mt-4", "mb-2");
	});
});
