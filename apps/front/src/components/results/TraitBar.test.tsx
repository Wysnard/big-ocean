import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TraitBar } from "./TraitBar";

const defaultProps = {
	traitName: "openness",
	score: 90,
	level: "H" as const,
	confidence: 85,
	color: "#6B5CE7",
	isExpanded: false,
	onToggle: vi.fn(),
	controlsId: "facets-openness",
};

describe("TraitBar", () => {
	it("renders trait name capitalized", () => {
		render(<TraitBar {...defaultProps} />);
		expect(screen.getByText("Openness")).toBeInTheDocument();
	});

	it("renders High level badge", () => {
		render(<TraitBar {...defaultProps} level="H" />);
		expect(screen.getByTestId("trait-level-openness")).toHaveTextContent("High");
	});

	it("renders Mid level badge", () => {
		render(<TraitBar {...defaultProps} level="M" />);
		expect(screen.getByTestId("trait-level-openness")).toHaveTextContent("Mid");
	});

	it("renders Low level badge", () => {
		render(<TraitBar {...defaultProps} level="L" />);
		expect(screen.getByTestId("trait-level-openness")).toHaveTextContent("Low");
	});

	it("renders score as fraction of 120", () => {
		render(<TraitBar {...defaultProps} score={90} />);
		expect(screen.getByText("90 / 120")).toBeInTheDocument();
	});

	it("renders confidence percentage", () => {
		render(<TraitBar {...defaultProps} confidence={85} />);
		expect(screen.getByTestId("trait-confidence-openness")).toHaveTextContent("85%");
	});

	it("applies trait color to dot and fill bar", () => {
		render(<TraitBar {...defaultProps} color="#E74C8B" />);
		const dot = screen.getByTestId("trait-color-openness");
		expect(dot).toHaveStyle({ backgroundColor: "#E74C8B" });
		const fill = screen.getByTestId("trait-fill-openness");
		expect(fill).toHaveStyle({ backgroundColor: "#E74C8B" });
	});

	it("calls onToggle when clicked", async () => {
		const onToggle = vi.fn();
		render(<TraitBar {...defaultProps} onToggle={onToggle} />);
		await userEvent.click(screen.getByTestId("trait-bar-openness"));
		expect(onToggle).toHaveBeenCalledOnce();
	});

	it("has correct ARIA attributes when collapsed", () => {
		render(<TraitBar {...defaultProps} isExpanded={false} />);
		const button = screen.getByTestId("trait-bar-openness");
		expect(button).toHaveAttribute("aria-expanded", "false");
		expect(button).toHaveAttribute("aria-controls", "facets-openness");
	});

	it("has correct ARIA attributes when expanded", () => {
		render(<TraitBar {...defaultProps} isExpanded={true} />);
		const button = screen.getByTestId("trait-bar-openness");
		expect(button).toHaveAttribute("aria-expanded", "true");
	});

	it("reduces fill opacity for low confidence (< 30)", () => {
		render(<TraitBar {...defaultProps} confidence={20} />);
		const fill = screen.getByTestId("trait-fill-openness");
		expect(fill).toHaveStyle({ opacity: 0.5 });
	});

	it("uses full opacity for normal confidence", () => {
		render(<TraitBar {...defaultProps} confidence={85} />);
		const fill = screen.getByTestId("trait-fill-openness");
		expect(fill).toHaveStyle({ opacity: 1 });
	});
});
