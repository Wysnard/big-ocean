// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortraitGeneratingState } from "./PortraitGeneratingState";

describe("PortraitGeneratingState", () => {
	it("renders the Nerin-voiced generating text", () => {
		render(<PortraitGeneratingState />);

		expect(screen.getByText("Nerin is writing your letter...")).toBeTruthy();
	});

	it("has the expected data-testid", () => {
		render(<PortraitGeneratingState />);

		expect(screen.getByTestId("portrait-generating-state")).toBeTruthy();
	});

	it("has data-slot attribute", () => {
		const { container } = render(<PortraitGeneratingState />);

		expect(container.querySelector("[data-slot='portrait-generating-state']")).toBeTruthy();
	});

	it("renders OceanSpinner with Loading label", () => {
		render(<PortraitGeneratingState />);

		expect(screen.getByLabelText("Loading")).toBeTruthy();
	});

	it("does not render any navigation, header, or profile content", () => {
		const { container } = render(<PortraitGeneratingState />);

		expect(container.querySelector("nav")).toBeNull();
		expect(container.querySelector("header")).toBeNull();
		expect(container.querySelector("[data-slot='trait-card']")).toBeNull();
		expect(container.querySelector("[data-slot='personality-radar-chart']")).toBeNull();
		expect(container.querySelector("[data-slot='archetype-hero']")).toBeNull();
		expect(container.querySelector("a")).toBeNull();
	});
});
