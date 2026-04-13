// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { GeometricSignature } from "@workspace/ui/components/geometric-signature";
import { describe, expect, it } from "vitest";

describe("GeometricSignature", () => {
	it('renders exactly 5 SVG elements for "OCEAR"', () => {
		const { container } = render(<GeometricSignature oceanCode5={"OCEAR"} size="profile" />);

		expect(container.querySelectorAll("svg")).toHaveLength(5);
	});

	it('sets the container aria-label for "OCEAR"', () => {
		render(<GeometricSignature oceanCode5={"OCEAR"} size="profile" />);

		expect(screen.getByLabelText("Personality signature: O C E A R")).toBeInTheDocument();
	});

	it("renders trait-labeled image wrappers in OCEAN order", () => {
		render(<GeometricSignature oceanCode5={"OCEAR"} size="profile" />);

		expect(screen.getByRole("img", { name: "openness" })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "conscientiousness" })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "extraversion" })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "agreeableness" })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "neuroticism" })).toBeInTheDocument();
	});

	it('uses 28px SVG dimensions for size="hero"', () => {
		const { container } = render(<GeometricSignature oceanCode5={"OCEAR"} size="hero" />);

		for (const svg of container.querySelectorAll("svg")) {
			expect(svg).toHaveAttribute("width", "28");
			expect(svg).toHaveAttribute("height", "28");
		}
	});

	it('uses 10px SVG dimensions for size="mini"', () => {
		const { container } = render(<GeometricSignature oceanCode5={"OCEAR"} size="mini" />);

		for (const svg of container.querySelectorAll("svg")) {
			expect(svg).toHaveAttribute("width", "10");
			expect(svg).toHaveAttribute("height", "10");
		}
	});

	it("exposes the stable data-testid on the container", () => {
		render(<GeometricSignature oceanCode5={"OCEAR"} size="card" />);

		expect(screen.getByTestId("geometric-signature")).toBeInTheDocument();
	});
});
