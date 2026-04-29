// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseReducedMotion = vi.hoisted(() => vi.fn(() => false));

vi.mock("motion/react", async () => {
	const actual = await vi.importActual<typeof import("motion/react")>("motion/react");
	return {
		...actual,
		useReducedMotion: () => mockUseReducedMotion(),
	};
});

import { HomepageDynamicHook } from "./HomepageDynamicHook";

describe("HomepageDynamicHook", () => {
	beforeEach(() => {
		mockUseReducedMotion.mockReturnValue(false);
	});

	it.each([
		["conversation", "A conversation that SEES you.", "SEES", "from-primary"],
		["portrait", "Words you've been CARRYING without knowing.", "CARRYING", "from-secondary"],
		["worldAfter", "A place that STAYS", "STAYS", "from-tertiary"],
		["reassurance", "YOURS", "YOURS", "from-primary"],
	] as const)("renders the exact hook copy and gradient for %s", (phase, expectedText, expectedKeyword, expectedGradient) => {
		render(<HomepageDynamicHook phase={phase} />);

		expect(screen.getByTestId("homepage-dynamic-hook")).toHaveAttribute("data-phase", phase);
		expect(screen.getByTestId("homepage-hook-text")).toHaveTextContent(expectedText);
		expect(screen.getByTestId("homepage-hook-keyword")).toHaveTextContent(expectedKeyword);
		expect(screen.getByTestId("homepage-hook-keyword").className).toContain(expectedGradient);
	});

	it("defaults to the conversation phase for SSR-safe initial output", () => {
		render(<HomepageDynamicHook />);

		expect(screen.getByTestId("homepage-dynamic-hook")).toHaveAttribute("data-phase", "conversation");
		expect(screen.getByTestId("homepage-hook-text")).toHaveTextContent(
			"A conversation that SEES you.",
		);
	});

	it("keeps the content correct and marks reduced-motion state", () => {
		mockUseReducedMotion.mockReturnValue(true);

		render(<HomepageDynamicHook phase="portrait" />);

		expect(screen.getByTestId("homepage-dynamic-hook")).toHaveAttribute(
			"data-reduced-motion",
			"true",
		);
		expect(screen.getByTestId("homepage-hook-keyword")).toHaveAttribute(
			"data-reduced-motion",
			"true",
		);
		expect(screen.getByTestId("homepage-hook-text")).toHaveTextContent(
			"Words you've been CARRYING without knowing.",
		);
	});

	it("renders as the supplied element via the `as` prop (e.g. h2 in the sticky auth card)", () => {
		render(<HomepageDynamicHook phase="conversation" as="h2" />);

		const root = screen.getByTestId("homepage-dynamic-hook");
		expect(root.tagName).toBe("H2");
	});
});
