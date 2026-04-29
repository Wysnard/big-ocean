// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }) => (
		<a {...props} href={to}>
			{children}
		</a>
	),
	useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
	AuthError: class AuthError extends Error {},
	useAuth: () => ({
		signIn: { email: vi.fn() },
		signUp: { email: vi.fn() },
		signOut: vi.fn(),
		refreshSession: vi.fn(),
		session: null,
		user: null,
		isAuthenticated: false,
		isPending: false,
		error: null,
	}),
}));

vi.mock("@workspace/ui/components/field", () => ({
	Field: ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
	FieldLabel: ({ children, htmlFor }: { children?: ReactNode; htmlFor?: string }) => (
		<label htmlFor={htmlFor}>{children}</label>
	),
	FieldError: () => null,
}));

vi.mock("@workspace/ui/components/input", () => ({
	Input: (props: Record<string, unknown>) => <input {...props} />,
}));

vi.mock("@workspace/ui/components/ocean-spinner", () => ({
	OceanSpinner: () => <span data-testid="ocean-spinner" />,
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
		const panel = screen.getByRole("complementary", { name: /log in/i });
		expect(within(panel).getByTestId("sticky-auth-panel")).toHaveAttribute("data-slot", "card");
		expect(within(panel).getByTestId("sticky-auth-panel")).toHaveAttribute(
			"data-homepage-slot",
			"sticky-auth-panel",
		);
	});

	it("uses shared card sections for the login rail content", () => {
		render(<StickyAuthPanel />);
		const card = screen.getByTestId("sticky-auth-panel");
		expect(card.querySelector('[data-slot="card-accent"]')).not.toBeInTheDocument();
		expect(card.querySelector('[data-slot="card-header"]')).toBeInTheDocument();
		expect(card.querySelector('[data-slot="card-content"]')).toBeInTheDocument();
		expect(card.querySelector('[data-slot="card-footer"]')).toBeInTheDocument();
	});

	it("does not duplicate the global brand wordmark — the global header carries it", () => {
		render(<StickyAuthPanel />);
		expect(screen.queryByText("big-")).not.toBeInTheDocument();
		expect(screen.queryByTestId("ocean-hieroglyphs")).not.toBeInTheDocument();
	});

	it("renders the HomepageDynamicHook component", () => {
		render(<StickyAuthPanel />);
		expect(screen.getByTestId("homepage-dynamic-hook")).toBeInTheDocument();
	});

	it("renders the embedded login form without a signup CTA", () => {
		render(<StickyAuthPanel />);
		expect(screen.queryByText(/start yours/i)).not.toBeInTheDocument();
		expect(screen.getByTestId("login-form-embed")).toBeInTheDocument();
		expect(screen.getByLabelText("Email")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
	});

	it("renders the tagline text", () => {
		render(<StickyAuthPanel />);
		expect(screen.getByText(/Free/)).toBeInTheDocument();
	});

	it("sets data-phase from useHomepagePhase", () => {
		render(<StickyAuthPanel />);
		const panel = screen.getByRole("complementary", { name: /log in/i });
		expect(within(panel).getByTestId("sticky-auth-panel")).toHaveAttribute(
			"data-phase",
			"conversation",
		);
	});

	it("sizes the sticky shell below the global header (h-14), not full viewport height", () => {
		render(<StickyAuthPanel />);
		const shell = screen.getByRole("complementary", { name: /log in/i }).firstElementChild;
		expect(shell?.className).toContain("top-14");
		expect(shell?.className).toContain("calc(100dvh-3.5rem)");
	});
});
