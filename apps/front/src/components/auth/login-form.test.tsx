// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth hook
const mockSignInEmail = vi.fn();
vi.mock("@/hooks/use-auth", async () => {
	// AuthError must be defined inside the factory to avoid hoisting issues
	class AuthError extends Error {
		readonly status: number | undefined;
		readonly code: string | undefined;
		constructor(message: string, status?: number, code?: string) {
			super(message);
			this.name = "AuthError";
			this.status = status;
			this.code = code;
		}
	}
	return {
		AuthError,
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
	};
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
	Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }) => (
		<a {...props} href={to}>
			{children}
		</a>
	),
}));

// Mock OceanHieroglyphSet
vi.mock("@workspace/ui/components/ocean-hieroglyph-set", () => ({
	OceanHieroglyphSet: () => <span data-testid="ocean-hieroglyphs" />,
}));

import { AuthError } from "@/hooks/use-auth";
import { LoginForm } from "./login-form";

function renderLoginForm(props = {}) {
	return render(<LoginForm {...props} />);
}

describe("LoginForm", () => {
	beforeEach(() => {
		mockSignInEmail.mockReset();
		mockNavigate.mockReset();
	});

	it("renders email and password fields", () => {
		renderLoginForm();

		expect(screen.getByLabelText("Email")).toBeTruthy();
		expect(screen.getByLabelText("Password")).toBeTruthy();
	});

	it("uses shared card primitives for the page variant", () => {
		const { container } = renderLoginForm();
		const card = container.querySelector('[data-slot="card"]');

		expect(card).toBeInTheDocument();
		expect(card?.querySelector('[data-slot="card-accent"]')).not.toBeInTheDocument();
		expect(card?.querySelector('[data-slot="card-header"]')).toBeInTheDocument();
		expect(card?.querySelector('[data-slot="card-content"]')).toBeInTheDocument();
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

		renderLoginForm({ redirectTo: "/me/session-123" });

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/me/session-123" });
		});
	});

	it("navigates to /me/:sessionId when anonymousSessionId is provided", async () => {
		mockSignInEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderLoginForm({ anonymousSessionId: "session-456" });

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({
				to: "/me/$conversationSessionId",
				params: { conversationSessionId: "session-456" },
			});
		});
	});

	it("navigates to /today by default after login", async () => {
		mockSignInEmail.mockResolvedValueOnce({ user: { id: "1" } });

		renderLoginForm();

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/today" });
		});
	});

	it("has accessible labels and aria attributes", () => {
		renderLoginForm();

		expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe("email");
		expect(screen.getByLabelText("Email")).toHaveAttribute("required");
		expect(screen.getByLabelText("Email")).toHaveAttribute("aria-required", "true");
		expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("current-password");
		expect(screen.getByLabelText("Password")).toHaveAttribute("required");
		expect(screen.getByLabelText("Password")).toHaveAttribute("aria-required", "true");
	});

	it("links inline validation errors to the relevant field", async () => {
		renderLoginForm();

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "" } });
		fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(screen.getByText("Email is required")).toBeInTheDocument();
		});

		expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby", "login-email-error");
		expect(screen.getByLabelText("Password")).toHaveAttribute(
			"aria-describedby",
			"login-password-error",
		);
	});

	it("renders link to signup page", () => {
		renderLoginForm();

		expect(screen.getByText("New here? Create account")).toBeTruthy();
	});

	it("redirects to /verify-email on 403 (unverified email) instead of showing error", async () => {
		mockSignInEmail.mockRejectedValueOnce(
			new AuthError("Email not verified", 403, "EMAIL_NOT_VERIFIED"),
		);

		renderLoginForm();

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "unverified@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "correctpassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({
				to: "/verify-email",
				search: { email: "unverified@example.com", error: undefined },
			});
		});

		// Should NOT show the generic error message
		expect(screen.queryByText("Invalid email or password")).toBeNull();
	});

	it("shows generic error for non-403 AuthError", async () => {
		mockSignInEmail.mockRejectedValueOnce(new AuthError("Invalid credentials", 401));

		renderLoginForm();

		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "wrongpassword1" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

		await waitFor(() => {
			expect(screen.getByText("Invalid email or password")).toBeTruthy();
		});

		// Should NOT navigate to verify-email
		expect(mockNavigate).not.toHaveBeenCalledWith(expect.objectContaining({ to: "/verify-email" }));
	});

	it("embed variant omits page chrome and duplicate signup link", () => {
		const { container } = render(<LoginForm variant="embed" />);
		expect(screen.getByTestId("login-form-embed")).toBeInTheDocument();
		expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
		expect(screen.queryByText(/New here\? Create account/)).not.toBeInTheDocument();
		expect(screen.getByText("Log in")).toBeInTheDocument();
		expect(container.querySelector('[data-slot="card"]')).not.toBeInTheDocument();
	});
});
