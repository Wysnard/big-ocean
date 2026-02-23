// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatAuthGate } from "./ChatAuthGate";

// Mock auth hook
vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({
		signUp: { email: vi.fn() },
		signIn: { email: vi.fn() },
		refreshSession: vi.fn(),
	}),
}));

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

describe("ChatAuthGate", () => {
	it("renders Nerin-voiced gate copy", () => {
		render(<ChatAuthGate sessionId="session-123" />);

		expect(
			screen.getByText("Create an account so your portrait is here when it's ready."),
		).toBeTruthy();
	});

	it("renders Sign Up and Sign In CTAs in gate mode", () => {
		render(<ChatAuthGate sessionId="session-123" />);

		expect(screen.getByTestId("chat-auth-gate-signup-btn")).toBeTruthy();
		expect(screen.getByTestId("chat-auth-gate-signin-btn")).toBeTruthy();
	});

	it("shows sign-up form when Sign Up is clicked", () => {
		render(<ChatAuthGate sessionId="session-123" />);

		fireEvent.click(screen.getByTestId("chat-auth-gate-signup-btn"));

		expect(screen.getByTestId("auth-gate-signup-submit")).toBeTruthy();
		expect(screen.queryByTestId("chat-auth-gate-signup-btn")).toBeNull();
	});

	it("shows sign-in form when Sign In is clicked", () => {
		render(<ChatAuthGate sessionId="session-123" />);

		fireEvent.click(screen.getByTestId("chat-auth-gate-signin-btn"));

		expect(screen.getByTestId("auth-gate-signin-submit")).toBeTruthy();
		expect(screen.queryByTestId("chat-auth-gate-signin-btn")).toBeNull();
	});

	it("has data-slot attribute for testing", () => {
		const { container } = render(<ChatAuthGate sessionId="session-123" />);

		expect(container.querySelector("[data-slot='chat-auth-gate']")).toBeTruthy();
	});

	it("does not show celebration card elements (no blurred signature, no masked archetype)", () => {
		const { container } = render(<ChatAuthGate sessionId="session-123" />);

		expect(screen.queryByText("Your Personality Profile is Ready!")).toBeNull();
		expect(container.querySelector("[data-slot='geometric-signature']")).toBeNull();
	});
});
