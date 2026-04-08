import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DepthMeter } from "../DepthMeter";

describe("DepthMeter", () => {
	describe("milestone tick marks", () => {
		it("renders three milestone ticks by default at 25%, 50%, 75%", () => {
			render(<DepthMeter currentTurn={0} totalTurns={15} />);

			const ticks = screen.getAllByTestId(/^milestone-tick-/);
			expect(ticks).toHaveLength(3);
			expect(screen.getByTestId("milestone-tick-25")).toBeInTheDocument();
			expect(screen.getByTestId("milestone-tick-50")).toBeInTheDocument();
			expect(screen.getByTestId("milestone-tick-75")).toBeInTheDocument();
		});

		it("renders custom milestones when provided", () => {
			render(<DepthMeter currentTurn={0} totalTurns={20} milestones={[0.5]} />);

			const ticks = screen.getAllByTestId(/^milestone-tick-/);
			expect(ticks).toHaveLength(1);
			expect(screen.getByTestId("milestone-tick-50")).toBeInTheDocument();
		});
	});

	describe("milestone reached state", () => {
		it("uses the 4/8/11 milestone mapping for a 15-turn assessment", () => {
			render(<DepthMeter currentTurn={4} totalTurns={15} />);

			const tick25 = screen.getByTestId("milestone-tick-25");
			expect(tick25).toHaveAttribute("data-reached", "true");

			const tick50 = screen.getByTestId("milestone-tick-50");
			expect(tick50).toHaveAttribute("data-reached", "false");
		});

		it("does not mark the 75% milestone until turn 11", () => {
			const { rerender } = render(<DepthMeter currentTurn={10} totalTurns={15} />);

			expect(screen.getByTestId("milestone-tick-75")).toHaveAttribute("data-reached", "false");

			rerender(<DepthMeter currentTurn={11} totalTurns={15} />);
			expect(screen.getByTestId("milestone-tick-75")).toHaveAttribute("data-reached", "true");
		});

		it("keeps fallback milestone position and trigger logic aligned for non-15 totals", () => {
			const { rerender } = render(<DepthMeter currentTurn={3} totalTurns={14} />);

			const tick25 = screen.getByTestId("milestone-tick-25");
			expect(tick25).toHaveAttribute("data-reached", "false");
			expect(tick25.getAttribute("style")).toContain("top: 28.57142857142857%");

			rerender(<DepthMeter currentTurn={4} totalTurns={14} />);
			expect(screen.getByTestId("milestone-tick-25")).toHaveAttribute("data-reached", "true");
		});

		it("marks all milestones as reached at 100%", () => {
			render(<DepthMeter currentTurn={15} totalTurns={15} />);

			expect(screen.getByTestId("milestone-tick-25")).toHaveAttribute("data-reached", "true");
			expect(screen.getByTestId("milestone-tick-50")).toHaveAttribute("data-reached", "true");
			expect(screen.getByTestId("milestone-tick-75")).toHaveAttribute("data-reached", "true");
		});

		it("marks no milestones as reached at 0 turns", () => {
			render(<DepthMeter currentTurn={0} totalTurns={15} />);

			expect(screen.getByTestId("milestone-tick-25")).toHaveAttribute("data-reached", "false");
			expect(screen.getByTestId("milestone-tick-50")).toHaveAttribute("data-reached", "false");
			expect(screen.getByTestId("milestone-tick-75")).toHaveAttribute("data-reached", "false");
		});
	});

	describe("ARIA accessibility", () => {
		it("has role=progressbar with correct aria attributes", () => {
			render(<DepthMeter currentTurn={5} totalTurns={15} />);

			const meter = screen.getByRole("progressbar");
			expect(meter).toHaveAttribute("aria-valuenow", "5");
			expect(meter).toHaveAttribute("aria-valuemin", "0");
			expect(meter).toHaveAttribute("aria-valuemax", "15");
			expect(meter).toHaveAttribute("aria-label", "Conversation depth");
		});

		it("updates aria-valuenow when currentTurn changes", () => {
			const { rerender } = render(<DepthMeter currentTurn={3} totalTurns={15} />);

			expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");

			rerender(<DepthMeter currentTurn={10} totalTurns={15} />);

			expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "10");
		});
	});

	describe("milestone announcements", () => {
		it("renders an aria-live region", () => {
			render(<DepthMeter currentTurn={0} totalTurns={15} />);

			const liveRegion = screen.getByTestId("depth-meter-announcer");
			expect(liveRegion).toHaveAttribute("aria-live", "polite");
		});

		it("announces when a milestone is newly reached", () => {
			const { rerender } = render(<DepthMeter currentTurn={3} totalTurns={15} />);

			const announcer = screen.getByTestId("depth-meter-announcer");
			expect(announcer).toHaveTextContent("");

			rerender(<DepthMeter currentTurn={4} totalTurns={15} />);
			expect(announcer).toHaveTextContent("25% depth reached");
		});
	});

	describe("edge cases", () => {
		it("handles totalTurns=0 without crashing", () => {
			render(<DepthMeter currentTurn={0} totalTurns={0} />);

			const meter = screen.getByRole("progressbar");
			expect(meter).toBeInTheDocument();
		});

		it("clamps progress to 1 when currentTurn exceeds totalTurns", () => {
			render(<DepthMeter currentTurn={20} totalTurns={15} />);

			const meter = screen.getByRole("progressbar");
			expect(meter).toHaveAttribute("aria-valuenow", "20");
		});
	});

	describe("fill bar", () => {
		it("renders a fill bar with height proportional to progress", () => {
			render(<DepthMeter currentTurn={8} totalTurns={15} />);

			const fill = screen.getByTestId("depth-meter-fill");
			expect(fill).toHaveStyle({ height: "53%" });
		});

		it("renders 0% height at 0 turns", () => {
			render(<DepthMeter currentTurn={0} totalTurns={15} />);

			const fill = screen.getByTestId("depth-meter-fill");
			expect(fill).toHaveStyle({ height: "0%" });
		});

		it("renders 100% height when complete", () => {
			render(<DepthMeter currentTurn={15} totalTurns={15} />);

			const fill = screen.getByTestId("depth-meter-fill");
			expect(fill).toHaveStyle({ height: "100%" });
		});
	});
});
