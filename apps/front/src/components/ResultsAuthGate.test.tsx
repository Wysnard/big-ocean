// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResultsAuthGate } from "./ResultsAuthGate";

const mockSignUpEmail = vi.fn();
const mockSignInEmail = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({
		signUp: {
			email: mockSignUpEmail,
		},
		signIn: {
			email: mockSignInEmail,
		},
		refreshSession: mockRefreshSession,
	}),
}));

describe("ResultsAuthGate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSignUpEmail.mockResolvedValue({});
		mockSignInEmail.mockResolvedValue({});
		mockRefreshSession.mockResolvedValue({});
	});

	it("renders teaser CTA with required data slots", () => {
		render(
			<ResultsAuthGate sessionId="session-123" onAuthSuccess={() => {}} onStartFresh={() => {}} />,
		);

		expect(screen.getByText("Your Personality Profile is Ready!")).toBeInTheDocument();
		expect(screen.getByText("Sign Up to See Your Results")).toHaveAttribute(
			"data-slot",
			"results-auth-gate-signup-cta",
		);
		expect(screen.getByText("Already have an account? Sign In")).toHaveAttribute(
			"data-slot",
			"results-auth-gate-signin-cta",
		);
	});

	it("validates sign-up fields inline", async () => {
		render(
			<ResultsAuthGate sessionId="session-123" onAuthSuccess={() => {}} onStartFresh={() => {}} />,
		);

		fireEvent.click(screen.getByText("Sign Up to See Your Results"));
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid-email" } });
		const form = screen
			.getByRole("button", { name: "Create Account and Reveal Results" })
			.closest("form");
		if (!form) {
			throw new Error("Expected sign-up form");
		}
		fireEvent.submit(form);

		const initialAlerts = await screen.findAllByRole("alert");
		expect(
			initialAlerts.some((alert) =>
				alert.textContent?.includes("Please enter a valid email address."),
			),
		).toBe(true);

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
		fireEvent.click(screen.getByRole("button", { name: "Create Account and Reveal Results" }));

		const passwordAlerts = await screen.findAllByRole("alert");
		expect(
			passwordAlerts.some((alert) =>
				alert.textContent?.includes("Password must be at least 12 characters."),
			),
		).toBe(true);
		expect(mockSignUpEmail).not.toHaveBeenCalled();
	});

	it("submits sign-up with anonymous session linking", async () => {
		const onAuthSuccess = vi.fn();

		render(
			<ResultsAuthGate
				sessionId="session-123"
				onAuthSuccess={onAuthSuccess}
				onStartFresh={() => {}}
			/>,
		);

		fireEvent.click(screen.getByText("Sign Up to See Your Results"));
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "long-enough-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create Account and Reveal Results" }));

		await waitFor(() => {
			expect(mockSignUpEmail).toHaveBeenCalledWith(
				"test@example.com",
				"long-enough-password",
				undefined,
				"session-123",
			);
		});
		expect(mockRefreshSession).toHaveBeenCalled();
		expect(onAuthSuccess).toHaveBeenCalled();
	});

	it("submits sign-in and calls auth success", async () => {
		const onAuthSuccess = vi.fn();

		render(
			<ResultsAuthGate
				sessionId="session-abc"
				onAuthSuccess={onAuthSuccess}
				onStartFresh={() => {}}
			/>,
		);

		fireEvent.click(screen.getByText("Already have an account? Sign In"));
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "long-enough-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Sign In and Reveal Results" }));

		await waitFor(() => {
			expect(mockSignInEmail).toHaveBeenCalledWith(
				"test@example.com",
				"long-enough-password",
				"session-abc",
			);
		});
		expect(mockRefreshSession).toHaveBeenCalled();
		expect(onAuthSuccess).toHaveBeenCalled();
	});

	it("renders expired state with start fresh action", () => {
		const onStartFresh = vi.fn();

		render(
			<ResultsAuthGate
				sessionId="session-expired"
				expired
				onAuthSuccess={() => {}}
				onStartFresh={onStartFresh}
			/>,
		);

		expect(screen.getByText("This Results Unlock Window Expired")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Start Fresh Assessment" }));
		expect(onStartFresh).toHaveBeenCalled();
	});

	it("omits anonymous session linking on expired sign-up", async () => {
		render(
			<ResultsAuthGate
				sessionId="session-expired"
				expired
				onAuthSuccess={() => {}}
				onStartFresh={() => {}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Sign Up to Start Fresh" }));
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "long-enough-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create Account and Reveal Results" }));

		await waitFor(() => {
			expect(mockSignUpEmail).toHaveBeenCalledWith(
				"test@example.com",
				"long-enough-password",
				undefined,
				undefined,
			);
		});
	});

	it("omits anonymous session linking on expired sign-in", async () => {
		render(
			<ResultsAuthGate
				sessionId="session-expired"
				expired
				onAuthSuccess={() => {}}
				onStartFresh={() => {}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "long-enough-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Sign In and Reveal Results" }));

		await waitFor(() => {
			expect(mockSignInEmail).toHaveBeenCalledWith(
				"test@example.com",
				"long-enough-password",
				undefined,
			);
		});
	});
});
