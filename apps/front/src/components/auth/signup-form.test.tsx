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
	Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// Mock OceanHieroglyphSet
vi.mock("@workspace/ui/components/ocean-hieroglyph-set", () => ({
	OceanHieroglyphSet: () => <span data-testid="ocean-hieroglyphs" />,
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

	it("navigates to verify-email after successful signup with redirectTo", async () => {
		mockSignUpEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderSignupForm({ redirectTo: "/me/session-123" });

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
				to: "/verify-email",
				search: { email: "test@example.com", error: undefined },
			});
		});
	});

	it("navigates to verify-email after successful signup with anonymousSessionId", async () => {
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
				to: "/verify-email",
				search: { email: "test@example.com", error: undefined },
			});
		});
	});

	it("navigates to verify-email by default after signup", async () => {
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
			expect(mockNavigate).toHaveBeenCalledWith({
				to: "/verify-email",
				search: { email: "test@example.com", error: undefined },
			});
		});
	});

	it("always navigates to verify-email regardless of redirectTo (open redirect guard)", async () => {
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
			// Should always go to verify-email, not navigate to external URL
			expect(mockNavigate).toHaveBeenCalledWith({
				to: "/verify-email",
				search: { email: "test@example.com", error: undefined },
			});
		});
	});

	it("has accessible labels and aria attributes", () => {
		renderSignupForm();

		expect(screen.getByLabelText("Name")).toHaveAttribute("required");
		expect(screen.getByLabelText("Name")).toHaveAttribute("aria-required", "true");
		expect(screen.getByLabelText("Name").getAttribute("autocomplete")).toBe("name");
		expect(screen.getByLabelText("Email")).toHaveAttribute("required");
		expect(screen.getByLabelText("Email")).toHaveAttribute("aria-required", "true");
		expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe("email");
		expect(screen.getByLabelText("Password")).toHaveAttribute("required");
		expect(screen.getByLabelText("Password")).toHaveAttribute("aria-required", "true");
		expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("new-password");
		expect(screen.getByLabelText("Confirm Password")).toHaveAttribute("required");
		expect(screen.getByLabelText("Confirm Password")).toHaveAttribute("aria-required", "true");
		expect(screen.getByLabelText("Confirm Password").getAttribute("autocomplete")).toBe(
			"new-password",
		);
	});

	it("links inline validation errors to the relevant fields", async () => {
		renderSignupForm();

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "" } });
		fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "different" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

		await waitFor(() => {
			expect(screen.getByText("Name is required")).toBeInTheDocument();
		});

		expect(screen.getByLabelText("Name")).toHaveAttribute("aria-describedby", "signup-name-error");
		expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby", "signup-email-error");
		expect(screen.getByLabelText("Password").getAttribute("aria-describedby")).toContain(
			"signup-password-error",
		);
		expect(screen.getByLabelText("Confirm Password")).toHaveAttribute(
			"aria-describedby",
			"signup-confirm-password-error",
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
