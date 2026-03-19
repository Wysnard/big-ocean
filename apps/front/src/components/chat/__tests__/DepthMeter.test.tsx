import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DepthMeter } from "../DepthMeter";

describe("DepthMeter", () => {
	describe("milestone tick marks", () => {
		it("renders three milestone ticks by default at 25%, 50%, 75%", () => {
			render(<DepthMeter currentTurn={0} totalTurns={25} />);

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
		it("marks milestones as reached when progress passes them", () => {
			// 7 of 25 = 28%, past the 25% milestone
			render(<DepthMeter currentTurn={7} totalTurns={25} />);

			const tick25 = screen.getByTestId("milestone-tick-25");
			expect(tick25).toHaveAttribute("data-reached", "true");

			const tick50 = screen.getByTestId("milestone-tick-50");
			expect(tick50).toHaveAttribute("data-reached", "false");
		});

		it("marks all milestones as reached at 100%", () => {
			render(<DepthMeter currentTurn={25} totalTurns={25} />);

			expect(screen.getByTestId("milestone-tick-25")).toHaveAttribute("data-reached", "true");
			expect(screen.getByTestId("milestone-tick-50")).toHaveAttribute("data-reached", "true");
			expect(screen.getByTestId("milestone-tick-75")).toHaveAttribute("data-reached", "true");
		});

		it("marks no milestones as reached at 0 turns", () => {
			render(<DepthMeter currentTurn={0} totalTurns={25} />);

			expect(screen.getByTestId("milestone-tick-25")).toHaveAttribute("data-reached", "false");
			expect(screen.getByTestId("milestone-tick-50")).toHaveAttribute("data-reached", "false");
			expect(screen.getByTestId("milestone-tick-75")).toHaveAttribute("data-reached", "false");
		});
	});

	describe("ARIA accessibility", () => {
		it("has role=progressbar with correct aria attributes", () => {
			render(<DepthMeter currentTurn={5} totalTurns={25} />);

			const meter = screen.getByRole("progressbar");
			expect(meter).toHaveAttribute("aria-valuenow", "5");
			expect(meter).toHaveAttribute("aria-valuemin", "0");
			expect(meter).toHaveAttribute("aria-valuemax", "25");
			expect(meter).toHaveAttribute("aria-label", "Conversation depth");
		});

		it("updates aria-valuenow when currentTurn changes", () => {
			const { rerender } = render(<DepthMeter currentTurn={3} totalTurns={25} />);

			expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");

			rerender(<DepthMeter currentTurn={10} totalTurns={25} />);

			expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "10");
		});
	});

	describe("milestone announcements", () => {
		it("renders an aria-live region", () => {
			render(<DepthMeter currentTurn={0} totalTurns={25} />);

			const liveRegion = screen.getByTestId("depth-meter-announcer");
			expect(liveRegion).toHaveAttribute("aria-live", "polite");
		});

		it("announces when a milestone is newly reached", () => {
			const { rerender } = render(<DepthMeter currentTurn={6} totalTurns={25} />);

			// 6/25 = 24%, not yet 25%
			const announcer = screen.getByTestId("depth-meter-announcer");
			expect(announcer).toHaveTextContent("");

			// 7/25 = 28%, just crossed 25%
			rerender(<DepthMeter currentTurn={7} totalTurns={25} />);
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
			render(<DepthMeter currentTurn={30} totalTurns={25} />);

			const meter = screen.getByRole("progressbar");
			expect(meter).toHaveAttribute("aria-valuenow", "30");
		});
	});

	describe("fill bar", () => {
		it("renders a fill bar with height proportional to progress", () => {
			render(<DepthMeter currentTurn={12} totalTurns={25} />);

			const fill = screen.getByTestId("depth-meter-fill");
			// 12/25 = 48%
			expect(fill).toHaveStyle({ height: "48%" });
		});

		it("renders 0% height at 0 turns", () => {
			render(<DepthMeter currentTurn={0} totalTurns={25} />);

			const fill = screen.getByTestId("depth-meter-fill");
			expect(fill).toHaveStyle({ height: "0%" });
		});

		it("renders 100% height when complete", () => {
			render(<DepthMeter currentTurn={25} totalTurns={25} />);

			const fill = screen.getByTestId("depth-meter-fill");
			expect(fill).toHaveStyle({ height: "100%" });
		});
	});
});
