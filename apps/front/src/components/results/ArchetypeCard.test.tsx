import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArchetypeCard } from "./ArchetypeCard";

const defaultProps = {
	archetypeName: "The Catalyst",
	oceanCode4: "HHHH",
	oceanCode5: "HHHHH",
	description: "A dynamic force who combines curiosity with execution.",
	color: "#6B5CE7",
	isCurated: true,
	overallConfidence: 82,
};

describe("ArchetypeCard", () => {
	it("renders archetype name", () => {
		render(<ArchetypeCard {...defaultProps} />);
		expect(screen.getByTestId("archetype-name")).toHaveTextContent("The Catalyst");
	});

	it("renders OCEAN codes", () => {
		render(<ArchetypeCard {...defaultProps} />);
		expect(screen.getByTestId("ocean-code-4")).toHaveTextContent("HHHH");
		expect(screen.getByTestId("ocean-code-5")).toHaveTextContent("HHHHH");
	});

	it("renders description text", () => {
		render(<ArchetypeCard {...defaultProps} />);
		expect(screen.getByTestId("archetype-description")).toHaveTextContent(
			"A dynamic force who combines curiosity with execution.",
		);
	});

	it("renders confidence value", () => {
		render(<ArchetypeCard {...defaultProps} />);
		expect(screen.getByTestId("confidence-indicator")).toHaveTextContent("82");
	});

	it("shows curated badge when isCurated is true", () => {
		render(<ArchetypeCard {...defaultProps} isCurated={true} />);
		expect(screen.getByTestId("curated-badge")).toHaveTextContent("Curated archetype");
	});

	it("hides curated badge when isCurated is false", () => {
		render(<ArchetypeCard {...defaultProps} isCurated={false} />);
		expect(screen.queryByTestId("curated-badge")).not.toBeInTheDocument();
	});

	it("applies color to accent bar", () => {
		render(<ArchetypeCard {...defaultProps} color="#E87B35" />);
		const accent = screen.getByTestId("archetype-accent");
		expect(accent).toHaveStyle({ backgroundColor: "#E87B35" });
	});

	it("has correct ARIA attributes", () => {
		render(<ArchetypeCard {...defaultProps} />);
		const card = screen.getByTestId("archetype-card");
		// <article> element has implicit role="article"
		expect(card.tagName).toBe("ARTICLE");
		expect(card).toHaveAttribute("aria-label", "Archetype: The Catalyst");
	});

	it("clamps confidence to 0-100 range", () => {
		render(<ArchetypeCard {...defaultProps} overallConfidence={150} />);
		expect(screen.getByTestId("confidence-indicator")).toHaveTextContent("100");
	});

	it("uses muted opacity for generated (non-curated) accent", () => {
		render(<ArchetypeCard {...defaultProps} isCurated={false} />);
		const accent = screen.getByTestId("archetype-accent");
		expect(accent).toHaveClass("opacity-60");
	});

	it("uses full opacity for curated accent", () => {
		render(<ArchetypeCard {...defaultProps} isCurated={true} />);
		const accent = screen.getByTestId("archetype-accent");
		expect(accent).toHaveClass("opacity-100");
	});
});
