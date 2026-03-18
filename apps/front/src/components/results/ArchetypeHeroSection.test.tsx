// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { OceanCode5Schema } from "@workspace/domain";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { describe, expect, it } from "vitest";
import { ArchetypeHeroSection } from "./ArchetypeHeroSection";

const defaultProps = {
	archetypeName: "The Beacon",
	oceanCode5: OceanCode5Schema.make("OCEAR"),
	dominantTrait: "openness" as const,
	overallConfidence: 0.82,
	description: "A dynamic force who combines curiosity with execution.",
};

function renderWithTooltipProvider(ui: React.ReactElement) {
	return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("ArchetypeHeroSection", () => {
	it("renders archetype name", () => {
		renderWithTooltipProvider(<ArchetypeHeroSection {...defaultProps} />);
		expect(screen.getByTestId("archetype-name")).toHaveTextContent("The Beacon");
	});

	it("renders OCEAN code letters", () => {
		renderWithTooltipProvider(<ArchetypeHeroSection {...defaultProps} />);
		expect(screen.getByTestId("ocean-code")).toHaveTextContent("OCEAR");
	});

	it("renders confidence pill", () => {
		renderWithTooltipProvider(<ArchetypeHeroSection {...defaultProps} />);
		expect(screen.getByText("82% confidence")).toBeInTheDocument();
	});

	it("renders archetype description", () => {
		renderWithTooltipProvider(<ArchetypeHeroSection {...defaultProps} />);
		expect(
			screen.getByText("A dynamic force who combines curiosity with execution."),
		).toBeInTheDocument();
	});

	it("renders tribe group label derived from Openness level", () => {
		renderWithTooltipProvider(<ArchetypeHeroSection {...defaultProps} />);
		expect(screen.getByTestId("tribe-group")).toHaveTextContent("O-Group: Open-Minded");
	});

	it("renders G-Group for Moderate Openness", () => {
		renderWithTooltipProvider(
			<ArchetypeHeroSection {...defaultProps} oceanCode5={OceanCode5Schema.make("MCEAR")} />,
		);
		expect(screen.getByTestId("tribe-group")).toHaveTextContent("G-Group: Grounded");
	});

	it("renders P-Group for Traditional Openness", () => {
		renderWithTooltipProvider(
			<ArchetypeHeroSection {...defaultProps} oceanCode5={OceanCode5Schema.make("TCEAR")} />,
		);
		expect(screen.getByTestId("tribe-group")).toHaveTextContent("P-Group: Practical");
	});

	it("renders OCEAN code letters as buttons with aria-describedby", () => {
		renderWithTooltipProvider(<ArchetypeHeroSection {...defaultProps} />);
		const oceanCodeEl = screen.getByTestId("ocean-code");
		const buttons = within(oceanCodeEl).getAllByRole("button");
		expect(buttons).toHaveLength(5);

		for (const button of buttons) {
			expect(button).toHaveAttribute("aria-describedby");
		}
	});

	it("OCEAN code letter buttons have minimum 44px tap target", () => {
		renderWithTooltipProvider(<ArchetypeHeroSection {...defaultProps} />);
		const oceanCodeEl = screen.getByTestId("ocean-code");
		const buttons = within(oceanCodeEl).getAllByRole("button");

		for (const button of buttons) {
			expect(button.className).toMatch(/min-w-11/);
			expect(button.className).toMatch(/min-h-11/);
		}
	});

	it("displays subtitle with displayName when provided", () => {
		renderWithTooltipProvider(<ArchetypeHeroSection {...defaultProps} displayName="Alice" />);
		expect(screen.getByText(/Alice\u2019s Personality Archetype/)).toBeInTheDocument();
	});

	it("displays default subtitle when no displayName", () => {
		renderWithTooltipProvider(<ArchetypeHeroSection {...defaultProps} />);
		expect(screen.getByText("Your Personality Archetype")).toBeInTheDocument();
	});
});
