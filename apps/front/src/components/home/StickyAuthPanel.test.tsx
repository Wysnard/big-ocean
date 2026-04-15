// @vitest-environment jsdom
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

vi.mock("./DepthScrollProvider", () => ({
	useHomepagePhase: () => "conversation",
}));

vi.mock("./HomepageDynamicHook", () => ({
	HomepageDynamicHook: () => <div data-testid="homepage-dynamic-hook" />,
}));

import { StickyAuthPanel } from "./StickyAuthPanel";

describe("StickyAuthPanel", () => {
	it("renders the panel with data-slot attribute", () => {
		render(<StickyAuthPanel />);
		const panel = screen.getByRole("complementary", { name: /sign up/i });
		expect(panel.querySelector("[data-slot='sticky-auth-panel']")).toBeInTheDocument();
	});

	it("renders the brand mark with OceanHieroglyphSet", () => {
		render(<StickyAuthPanel />);
		expect(screen.getByText("big-")).toBeInTheDocument();
		expect(screen.getByTestId("ocean-hieroglyphs")).toBeInTheDocument();
	});

	it("renders the HomepageDynamicHook component", () => {
		render(<StickyAuthPanel />);
		expect(screen.getByTestId("homepage-dynamic-hook")).toBeInTheDocument();
	});

	it("renders signup and login links", () => {
		render(<StickyAuthPanel />);
		expect(screen.getByText(/start yours/i)).toHaveAttribute("href", "/signup");
		expect(screen.getByText(/log in/i)).toHaveAttribute("href", "/login");
	});

	it("renders the tagline text", () => {
		render(<StickyAuthPanel />);
		expect(screen.getByText(/Free/)).toBeInTheDocument();
	});

	it("sets data-phase from useHomepagePhase", () => {
		render(<StickyAuthPanel />);
		const panel = screen.getByRole("complementary", { name: /sign up/i });
		expect(panel.querySelector("[data-phase='conversation']")).toBeInTheDocument();
	});

	it("sizes the sticky shell below the global header (h-14), not full viewport height", () => {
		render(<StickyAuthPanel />);
		const shell = screen.getByRole("complementary", { name: /sign up/i }).firstElementChild;
		expect(shell?.className).toContain("top-14");
		expect(shell?.className).toContain("calc(100dvh-3.5rem)");
	});
});
