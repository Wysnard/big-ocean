// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock auth hook
const mockSignInEmail = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({
		signIn: { email: mockSignInEmail },
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

import { LoginForm } from "./login-form";

function renderLoginForm(props = {}) {
	return render(<LoginForm {...props} />);
}

describe("LoginForm", () => {
	it("renders email and password fields", () => {
		renderLoginForm();

		expect(screen.getByLabelText("Email")).toBeTruthy();
		expect(screen.getByLabelText("Password")).toBeTruthy();
	});

	it("shows generic error message for any login failure (AC #3)", async () => {
		mockSignInEmail.mockRejectedValueOnce(new Error("INVALID_PASSWORD"));

		renderLoginForm();

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "wrongpassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeTruthy();
			// Must always show generic message, never reveal which field is wrong
			expect(screen.getByText("Invalid email or password")).toBeTruthy();
		});
	});

	it("shows same generic error for non-existent email (AC #3)", async () => {
		mockSignInEmail.mockRejectedValueOnce(new Error("USER_NOT_FOUND"));

		renderLoginForm();

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "nonexistent@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "somepassword12" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			// Same generic message for both wrong-email and wrong-password
			expect(screen.getByText("Invalid email or password")).toBeTruthy();
		});
	});

	it("navigates to redirectTo after successful login", async () => {
		mockSignInEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderLoginForm({ redirectTo: "/results/session-123" });

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/results/session-123" });
		});
	});

	it("navigates to /results/:sessionId when anonymousSessionId is provided", async () => {
		mockSignInEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderLoginForm({ anonymousSessionId: "session-456" });

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({
				to: "/results/$assessmentSessionId",
				params: { assessmentSessionId: "session-456" },
			});
		});
	});

	it("navigates to /profile by default after login", async () => {
		mockSignInEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderLoginForm();

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/profile" });
		});
	});

	it("has accessible labels and aria attributes", () => {
		renderLoginForm();

		expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe("email");
		expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("current-password");
	});

	it("renders link to signup page", () => {
		renderLoginForm();

		expect(screen.getByText("New here? Create account")).toBeTruthy();
	});
});
