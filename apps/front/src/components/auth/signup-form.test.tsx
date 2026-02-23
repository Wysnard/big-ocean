// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock auth hook
const mockSignUpEmail = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({
		signUp: { email: mockSignUpEmail },
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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

// Mock OceanShapeSet
vi.mock("../ocean-shapes", () => ({
	OceanShapeSet: () => <span data-testid="ocean-shapes" />,
}));

// Mock auth-session-linking
vi.mock("../../lib/auth-session-linking", () => ({
	buildAuthPageHref: (path: string) => path,
}));

import { SignupForm } from "./signup-form";

function renderSignupForm(props = {}) {
	return render(<SignupForm {...props} />);
}

describe("SignupForm", () => {
	it("renders name, email, password, and confirm password fields", () => {
		renderSignupForm();

		expect(screen.getByLabelText("Name")).toBeTruthy();
		expect(screen.getByLabelText("Email")).toBeTruthy();
		expect(screen.getByLabelText("Password")).toBeTruthy();
		expect(screen.getByLabelText("Confirm Password")).toBeTruthy();
	});

	it("shows error when passwords do not match", async () => {
		renderSignupForm();

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "differentpassword" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeTruthy();
			expect(screen.getByText("Passwords do not match")).toBeTruthy();
		});
	});

	it("shows error when password is too short (<12 chars)", async () => {
		renderSignupForm();

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "short" },
		});

		// Submit the form directly
		const form = screen.getByLabelText("Name").closest("form");
		fireEvent.submit(form!);

		await waitFor(() => {
			expect(screen.getByText("Password must be at least 12 characters")).toBeTruthy();
		});
	});

	it("shows error for duplicate email (UserAlreadyExists)", async () => {
		mockSignUpEmail.mockRejectedValueOnce(new Error("User already exists"));

		renderSignupForm();

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dupe@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

		await waitFor(() => {
			expect(screen.getByText("An account with this email already exists")).toBeTruthy();
		});
	});

	it("shows error for compromised password", async () => {
		mockSignUpEmail.mockRejectedValueOnce(
			new Error("This password has appeared in a data breach. Please choose a different password."),
		);

		renderSignupForm();

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "password12345" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "password12345" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

		await waitFor(() => {
			expect(
				screen.getByText(
					"This password has appeared in a data breach. Please choose a different password.",
				),
			).toBeTruthy();
		});
	});

	it("navigates to redirectTo after successful signup", async () => {
		mockSignUpEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderSignupForm({ redirectTo: "/results/session-123" });

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/results/session-123" });
		});
	});

	it("navigates to /results/:sessionId when anonymousSessionId is provided", async () => {
		mockSignUpEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderSignupForm({ anonymousSessionId: "session-456" });

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({
				to: "/results/$assessmentSessionId",
				params: { assessmentSessionId: "session-456" },
			});
		});
	});

	it("navigates to /profile by default after signup", async () => {
		mockSignUpEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderSignupForm();

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/profile" });
		});
	});

	it("ignores non-relative redirectTo (open redirect guard)", async () => {
		mockSignUpEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderSignupForm({ redirectTo: "https://evil.com" });

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

		await waitFor(() => {
			// Should fall through to /profile, not navigate to external URL
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/profile" });
		});
	});

	it("has accessible labels and aria attributes", () => {
		renderSignupForm();

		expect(screen.getByLabelText("Name").getAttribute("autocomplete")).toBe("name");
		expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe("email");
		expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("new-password");
		expect(screen.getByLabelText("Confirm Password").getAttribute("autocomplete")).toBe(
			"new-password",
		);
	});

	it("shows password minimum length helper text", () => {
		renderSignupForm();

		expect(screen.getByText("Minimum 12 characters")).toBeTruthy();
	});

	it("renders link to login page", () => {
		renderSignupForm();

		expect(screen.getByText("Already exploring? Sign in")).toBeTruthy();
	});
});
