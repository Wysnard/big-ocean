import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: any) => (
		<a {...props} href={props.to as string}>
			{children}
		</a>
	),
}));

vi.mock("@workspace/ui/components/ocean-hieroglyph-set", () => ({
	OceanHieroglyphSet: () => <span data-testid="ocean-hieroglyphs" />,
}));

import { TimelinePlaceholder } from "./TimelinePlaceholder";

describe("TimelinePlaceholder", () => {
	it("renders the timeline placeholder container", () => {
		render(<TimelinePlaceholder />);
		expect(screen.getByTestId("timeline-placeholder")).toBeInTheDocument();
	});

	it("preserves data-testid='hero-section' on the hero section", () => {
		render(<TimelinePlaceholder />);
		expect(screen.getByTestId("hero-section")).toBeInTheDocument();
	});

	it("renders the headline text", () => {
		render(<TimelinePlaceholder />);
		expect(screen.getByText("Not a personality quiz.")).toBeTruthy();
		expect(screen.getByText("A conversation.")).toBeTruthy();
	});

	it("renders the subheadline", () => {
		render(<TimelinePlaceholder />);
		expect(
			screen.getByText("A portrait of who you are that no test has ever given you."),
		).toBeInTheDocument();
	});

	it("preserves data-testid='hero-cta' on the CTA button", () => {
		render(<TimelinePlaceholder />);
		const cta = screen.getByTestId("hero-cta");
		expect(cta).toBeInTheDocument();
		expect(cta).toHaveTextContent("Start yours");
	});

	it("preserves data-testid='how-it-works' on the HowItWorks section", () => {
		render(<TimelinePlaceholder />);
		expect(screen.getByTestId("how-it-works")).toBeInTheDocument();
	});

	it("renders placeholder sections for Stories 9.3 and 9.4", () => {
		render(<TimelinePlaceholder />);
		expect(screen.getByTestId("timeline-phases-placeholder")).toBeInTheDocument();
		expect(screen.getByTestId("reassurance-placeholder")).toBeInTheDocument();
	});

	it("renders the brand mark on mobile (hidden on lg)", () => {
		render(<TimelinePlaceholder />);
		expect(screen.getByText("big-")).toBeInTheDocument();
	});

	it("has data-slot attributes on structural elements", () => {
		render(<TimelinePlaceholder />);
		expect(screen.getByTestId("timeline-placeholder").getAttribute("data-slot")).toBe(
			"timeline-placeholder",
		);
		expect(screen.getByTestId("hero-section").getAttribute("data-slot")).toBe("hero-section");
		expect(screen.getByTestId("timeline-phases-placeholder").getAttribute("data-slot")).toBe(
			"timeline-phases-placeholder",
		);
		expect(screen.getByTestId("reassurance-placeholder").getAttribute("data-slot")).toBe(
			"reassurance-placeholder",
		);
	});
});
