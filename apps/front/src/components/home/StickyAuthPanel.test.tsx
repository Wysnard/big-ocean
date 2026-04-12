import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: any) => (
		<a {...props} href={props.to as string}>
			{children}
		</a>
	),
	useNavigate: () => vi.fn(),
}));

vi.mock("@workspace/ui/components/ocean-hieroglyph-set", () => ({
	OceanHieroglyphSet: () => <span data-testid="ocean-hieroglyphs" />,
}));

vi.mock("@workspace/ui/components/ocean-spinner", () => ({
	OceanSpinner: () => <span data-testid="ocean-spinner" />,
}));

vi.mock("@workspace/ui/components/field", () => ({
	Field: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	// biome-ignore lint/a11y/noLabelWithoutControl: test mock — associated control rendered by component under test
	FieldLabel: ({ children, ...props }: any) => <label {...props}>{children}</label>,
	FieldError: ({ errors, ...props }: any) => (
		<span {...props}>{errors?.map((e: any) => e.message).join(", ")}</span>
	),
}));

vi.mock("@workspace/ui/components/input", () => ({
	Input: (props: any) => <input {...props} />,
}));

vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({
		signUp: { email: vi.fn() },
		signIn: { email: vi.fn() },
		signOut: vi.fn(),
		refreshSession: vi.fn(),
		session: null,
		user: null,
		isAuthenticated: false,
		isPending: false,
		error: null,
	}),
}));

import { StickyAuthPanel } from "./StickyAuthPanel";

describe("StickyAuthPanel", () => {
	it("renders the panel container", () => {
		render(<StickyAuthPanel isAuthenticated={false} />);
		expect(screen.getByTestId("sticky-auth-panel")).toBeInTheDocument();
	});

	it("renders the brand mark with OceanHieroglyphSet", () => {
		render(<StickyAuthPanel isAuthenticated={false} />);
		expect(screen.getByText("big-")).toBeInTheDocument();
		expect(screen.getByTestId("ocean-hieroglyphs")).toBeInTheDocument();
	});

	it("renders the static hook line", () => {
		render(<StickyAuthPanel isAuthenticated={false} />);
		expect(screen.getByTestId("hook-line")).toHaveTextContent("A conversation that sees you.");
	});

	it("renders the tagline", () => {
		render(<StickyAuthPanel isAuthenticated={false} />);
		const tagline = screen.getByTestId("tagline");
		expect(tagline).toBeInTheDocument();
		expect(tagline.textContent).toContain("30 min");
		expect(tagline.textContent).toContain("Free");
		expect(tagline.textContent).toContain("No credit card");
	});

	it("renders OCEAN breathing shapes", () => {
		render(<StickyAuthPanel isAuthenticated={false} />);
		const shapes = screen.getByTestId("ocean-shapes");
		expect(shapes).toBeInTheDocument();
		expect(shapes).toHaveAttribute("aria-hidden", "true");
	});

	describe("when unauthenticated", () => {
		it("renders the signup form", () => {
			render(<StickyAuthPanel isAuthenticated={false} />);
			expect(screen.getByTestId("homepage-signup-form")).toBeInTheDocument();
		});

		it("renders the 'Already have an account? Log in' link", () => {
			render(<StickyAuthPanel isAuthenticated={false} />);
			const loginLink = screen.getByTestId("login-link");
			expect(loginLink).toBeInTheDocument();
			expect(loginLink).toHaveTextContent("Log in");
			expect(loginLink).toHaveAttribute("href", "/login");
		});

		it("does not render the 'Continue to Nerin' link", () => {
			render(<StickyAuthPanel isAuthenticated={false} />);
			expect(screen.queryByTestId("continue-to-nerin")).not.toBeInTheDocument();
		});
	});

	describe("when authenticated", () => {
		it("renders 'Continue to Nerin' link instead of signup form", () => {
			render(<StickyAuthPanel isAuthenticated={true} />);
			const continueLink = screen.getByTestId("continue-to-nerin");
			expect(continueLink).toBeInTheDocument();
			expect(continueLink).toHaveTextContent("Continue to Nerin");
			expect(continueLink).toHaveAttribute("href", "/chat");
		});

		it("does not render the signup form", () => {
			render(<StickyAuthPanel isAuthenticated={true} />);
			expect(screen.queryByTestId("homepage-signup-form")).not.toBeInTheDocument();
		});

		it("does not render the login link", () => {
			render(<StickyAuthPanel isAuthenticated={true} />);
			expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
		});
	});

	it("has data-slot attributes on key elements", () => {
		render(<StickyAuthPanel isAuthenticated={false} />);
		expect(screen.getByTestId("sticky-auth-panel").getAttribute("data-slot")).toBe(
			"sticky-auth-panel",
		);
		expect(screen.getByTestId("hook-line").getAttribute("data-slot")).toBe("hook-line");
		expect(screen.getByTestId("tagline").getAttribute("data-slot")).toBe("tagline");
		expect(screen.getByTestId("ocean-shapes").getAttribute("data-slot")).toBe("ocean-shapes");
	});
});
