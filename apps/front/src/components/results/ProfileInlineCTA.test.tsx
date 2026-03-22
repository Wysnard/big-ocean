// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

import { ProfileInlineCTA } from "./ProfileInlineCTA";

describe("ProfileInlineCTA", () => {
	it("renders button with correct text for unauthenticated visitors", () => {
		render(<ProfileInlineCTA authState="unauthenticated" />);
		expect(screen.getByTestId("profile-inline-cta-button")).toHaveTextContent(
			"Discover your own personality",
		);
	});

	it("button has 44px minimum tap target", () => {
		render(<ProfileInlineCTA authState="unauthenticated" />);
		const button = screen.getByTestId("profile-inline-cta-button");
		expect(button.className).toMatch(/min-h-11/);
	});

	it("renders for authenticated-no-assessment state", () => {
		render(<ProfileInlineCTA authState="authenticated-no-assessment" />);
		expect(screen.getByTestId("profile-inline-cta-button")).toBeInTheDocument();
	});

	it("does NOT render for authenticated-assessed state", () => {
		render(<ProfileInlineCTA authState="authenticated-assessed" />);
		expect(screen.queryByTestId("profile-inline-cta-button")).not.toBeInTheDocument();
	});

	it("links to /signup for unauthenticated visitors", () => {
		render(<ProfileInlineCTA authState="unauthenticated" />);
		const link = screen.getByTestId("profile-inline-cta-button").closest("a");
		expect(link).toHaveAttribute("href", "/signup");
	});

	it("links to /chat for authenticated-no-assessment visitors", () => {
		render(<ProfileInlineCTA authState="authenticated-no-assessment" />);
		const link = screen.getByTestId("profile-inline-cta-button").closest("a");
		expect(link).toHaveAttribute("href", "/chat");
	});

	it("does NOT render when isOwnProfile is true (even for unauthenticated state)", () => {
		render(<ProfileInlineCTA authState="unauthenticated" isOwnProfile={true} />);
		expect(screen.queryByTestId("profile-inline-cta-button")).not.toBeInTheDocument();
	});

	it("renders when isOwnProfile is false", () => {
		render(<ProfileInlineCTA authState="unauthenticated" isOwnProfile={false} />);
		expect(screen.getByTestId("profile-inline-cta-button")).toBeInTheDocument();
	});
});
