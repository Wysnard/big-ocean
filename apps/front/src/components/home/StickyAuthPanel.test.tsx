// @vitest-environment jsdom
import type { ReactNode } from "react";
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

vi.mock("@workspace/ui/components/ocean-hieroglyph-set", () => ({
	OceanHieroglyphSet: () => <span data-testid="ocean-hieroglyphs" />,
}));

vi.mock("@workspace/ui/components/field", () => ({
	Field: ({ children, ...props }: { children?: ReactNode }) => (
		<div {...props}>{children}</div>
	),
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

	it("renders signup link and embedded login form", () => {
		render(<StickyAuthPanel />);
		expect(screen.getByText(/start yours/i)).toHaveAttribute("href", "/signup");
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
