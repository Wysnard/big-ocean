// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseReducedMotion = vi.hoisted(() => vi.fn(() => false));

vi.mock("motion/react", async () => {
	const actual = await vi.importActual<typeof import("motion/react")>("motion/react");
	return {
		...actual,
		useReducedMotion: () => mockUseReducedMotion(),
	};
});

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: Record<string, unknown>) => (
		<a href={String(to)} {...props}>
			{children as ReactNode}
		</a>
	),
}));

import { HomepageDynamicHook } from "./HomepageDynamicHook";
import { MobileHero } from "./MobileHero";

describe("HomepageDynamicHook", () => {
	beforeEach(() => {
		mockUseReducedMotion.mockReturnValue(false);
	});

	it.each([
		["conversation", "A conversation thatSEESyou.", "SEES", "from-primary"],
		["portrait", "Words you've beenCARRYINGwithout knowing.", "CARRYING", "from-secondary"],
		["worldAfter", "A place thatSTAYS.", "STAYS", "from-tertiary"],
		["reassurance", "YOURS.", "YOURS.", "from-primary"],
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
		expect(screen.getByTestId("homepage-hook-text")).toHaveTextContent("A conversation thatSEESyou.");
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
			"Words you've beenCARRYINGwithout knowing.",
		);
	});

	it("pins the mobile hero to the conversation hook", () => {
		render(<MobileHero />);

		const mobileHero = screen.getByTestId("mobile-homepage-hero");
		expect(within(mobileHero).getByTestId("homepage-dynamic-hook")).toHaveAttribute(
			"data-phase",
			"conversation",
		);
		expect(within(mobileHero).getByTestId("homepage-hook-text")).toHaveTextContent(
			"A conversation thatSEESyou.",
		);
	});

	it("uses dark text on lightBackground so copy stays visible when the app theme is dark", () => {
		render(<HomepageDynamicHook phase="conversation" lightBackground />);

		const root = screen.getByTestId("homepage-dynamic-hook");
		expect(root.className).toContain("text-[#1a1a2e]");
	});
});
