import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: any) => (
		<a {...props} href={props.to as string}>
			{children}
		</a>
	),
}));

import { StickyBottomCTA } from "./StickyBottomCTA";

describe("StickyBottomCTA", () => {
	it("renders the bottom CTA container", () => {
		render(<StickyBottomCTA isAuthenticated={false} />);
		expect(screen.getByTestId("sticky-bottom-cta")).toBeInTheDocument();
	});

	it("has fixed positioning and z-20 for proper stacking", () => {
		render(<StickyBottomCTA isAuthenticated={false} />);
		const cta = screen.getByTestId("sticky-bottom-cta");
		expect(cta.className).toMatch(/fixed/);
		expect(cta.className).toMatch(/bottom-0/);
		expect(cta.className).toMatch(/z-20/);
	});

	it("is hidden on desktop via lg:hidden", () => {
		render(<StickyBottomCTA isAuthenticated={false} />);
		const cta = screen.getByTestId("sticky-bottom-cta");
		expect(cta.className).toMatch(/lg:hidden/);
	});

	it("has backdrop blur for visual separation", () => {
		render(<StickyBottomCTA isAuthenticated={false} />);
		const cta = screen.getByTestId("sticky-bottom-cta");
		expect(cta.className).toMatch(/backdrop-blur/);
		expect(cta.className).toMatch(/border-t/);
	});

	describe("when unauthenticated", () => {
		it("renders 'Start yours' button linking to /signup", () => {
			render(<StickyBottomCTA isAuthenticated={false} />);
			const link = screen.getByTestId("mobile-signup-cta");
			expect(link).toBeInTheDocument();
			expect(link).toHaveTextContent("Start yours");
			expect(link).toHaveAttribute("href", "/signup");
		});

		it("does not render the continue CTA", () => {
			render(<StickyBottomCTA isAuthenticated={false} />);
			expect(screen.queryByTestId("mobile-continue-cta")).not.toBeInTheDocument();
		});
	});

	describe("when authenticated", () => {
		it("renders 'Continue to Nerin' button linking to /chat", () => {
			render(<StickyBottomCTA isAuthenticated={true} />);
			const link = screen.getByTestId("mobile-continue-cta");
			expect(link).toBeInTheDocument();
			expect(link).toHaveTextContent("Continue to Nerin");
			expect(link).toHaveAttribute("href", "/chat");
		});

		it("does not render the signup CTA", () => {
			render(<StickyBottomCTA isAuthenticated={true} />);
			expect(screen.queryByTestId("mobile-signup-cta")).not.toBeInTheDocument();
		});
	});

	it("has data-slot attribute", () => {
		render(<StickyBottomCTA isAuthenticated={false} />);
		expect(screen.getByTestId("sticky-bottom-cta").getAttribute("data-slot")).toBe(
			"sticky-bottom-cta",
		);
	});
});
