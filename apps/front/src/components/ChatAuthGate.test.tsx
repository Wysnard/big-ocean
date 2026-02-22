// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const queryClient = new QueryClient({
	defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(component: React.ReactElement) {
	return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe("ChatAuthGate", () => {
	it("renders Nerin-voiced gate copy", () => {
		renderWithProviders(<ChatAuthGate sessionId="session-123" onAuthSuccess={vi.fn()} />);

		expect(
			screen.getByText("Create an account so your portrait is here when it's ready."),
		).toBeTruthy();
	});

	it("renders Sign Up and Sign In CTAs in gate mode", () => {
		renderWithProviders(<ChatAuthGate sessionId="session-123" onAuthSuccess={vi.fn()} />);

		expect(screen.getByTestId("chat-auth-gate-signup-btn")).toBeTruthy();
		expect(screen.getByTestId("chat-auth-gate-signin-btn")).toBeTruthy();
	});

	it("shows sign-up form when Sign Up is clicked", () => {
		renderWithProviders(<ChatAuthGate sessionId="session-123" onAuthSuccess={vi.fn()} />);

		fireEvent.click(screen.getByTestId("chat-auth-gate-signup-btn"));

		expect(screen.getByTestId("auth-gate-signup-submit")).toBeTruthy();
		expect(screen.queryByTestId("chat-auth-gate-signup-btn")).toBeNull();
	});

	it("shows sign-in form when Sign In is clicked", () => {
		renderWithProviders(<ChatAuthGate sessionId="session-123" onAuthSuccess={vi.fn()} />);

		fireEvent.click(screen.getByTestId("chat-auth-gate-signin-btn"));

		expect(screen.getByTestId("auth-gate-signin-submit")).toBeTruthy();
		expect(screen.queryByTestId("chat-auth-gate-signin-btn")).toBeNull();
	});

	it("has data-slot attribute for testing", () => {
		const { container } = renderWithProviders(
			<ChatAuthGate sessionId="session-123" onAuthSuccess={vi.fn()} />,
		);

		expect(container.querySelector("[data-slot='chat-auth-gate']")).toBeTruthy();
	});

	it("does not show celebration card elements (no blurred signature, no masked archetype)", () => {
		const { container } = renderWithProviders(
			<ChatAuthGate sessionId="session-123" onAuthSuccess={vi.fn()} />,
		);

		expect(screen.queryByText("Your Personality Profile is Ready!")).toBeNull();
		expect(container.querySelector("[data-slot='geometric-signature']")).toBeNull();
	});
});
