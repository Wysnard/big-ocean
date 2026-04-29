// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignUpEmail = vi.fn();
const mockNavigate = vi.fn();

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

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
	Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@workspace/ui/components/field", () => ({
	Field: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	// biome-ignore lint/a11y/noLabelWithoutControl: test mock — associated control rendered by component under test
	FieldLabel: ({ children, ...props }: any) => <label {...props}>{children}</label>,
	FieldError: ({ errors, ...props }: any) => (
		<span role="alert" {...props}>
			{errors?.map((e: any) => e.message).join(", ")}
		</span>
	),
}));

vi.mock("@workspace/ui/components/input", () => ({
	Input: (props: any) => <input {...props} />,
}));

vi.mock("@workspace/ui/components/ocean-spinner", () => ({
	OceanSpinner: () => <span data-testid="ocean-spinner" />,
}));

import { HomepageSignupForm } from "./HomepageSignupForm";

describe("HomepageSignupForm", () => {
	beforeEach(() => {
		mockSignUpEmail.mockReset();
		mockNavigate.mockReset();
	});

	it("renders all form fields", () => {
		render(<HomepageSignupForm />);

		expect(screen.getByLabelText("Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Email")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
		expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
	});

	it("renders the 'Start yours' submit button", () => {
		render(<HomepageSignupForm />);

		const submitButton = screen.getByTestId("homepage-signup-submit");
		expect(submitButton).toBeInTheDocument();
		expect(submitButton).toHaveTextContent("Start yours");
	});

	it("has data-testid on the form element", () => {
		render(<HomepageSignupForm />);
		expect(screen.getByTestId("homepage-signup-form")).toBeInTheDocument();
	});

	it("has data-slot on the form element", () => {
		render(<HomepageSignupForm />);
		expect(screen.getByTestId("homepage-signup-form").getAttribute("data-slot")).toBe(
			"homepage-signup-form",
		);
	});

	it("shows validation error when password is too short", async () => {
		render(<HomepageSignupForm />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test User" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
		fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "short" } });
		fireEvent.submit(screen.getByTestId("homepage-signup-form"));

		await waitFor(() => {
			expect(screen.getByText("Password must be at least 12 characters")).toBeTruthy();
		});
	});

	it("shows validation error when passwords do not match", async () => {
		render(<HomepageSignupForm />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test User" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword1" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "differentpassword" },
		});
		fireEvent.submit(screen.getByTestId("homepage-signup-form"));

		await waitFor(() => {
			expect(screen.getByText("Passwords do not match")).toBeTruthy();
		});
	});

	it("calls signUp.email and navigates to /verify-email on successful submission", async () => {
		mockSignUpEmail.mockResolvedValueOnce({ user: { id: "1" } });
		render(<HomepageSignupForm />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test User" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword123" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "securepassword123" },
		});
		fireEvent.submit(screen.getByTestId("homepage-signup-form"));

		await waitFor(() => {
			expect(mockSignUpEmail).toHaveBeenCalledWith(
				"test@example.com",
				"securepassword123",
				"Test User",
				expect.any(String),
			);
		});

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({
				to: "/verify-email",
				search: { email: "test@example.com", error: undefined },
			});
		});
	});

	it("shows server error for duplicate email", async () => {
		mockSignUpEmail.mockRejectedValueOnce(new Error("User already exists"));
		render(<HomepageSignupForm />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test User" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dupe@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword123" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "securepassword123" },
		});
		fireEvent.submit(screen.getByTestId("homepage-signup-form"));

		await waitFor(() => {
			expect(screen.getByText("An account with this email already exists")).toBeInTheDocument();
		});
	});

	it("shows server error for compromised password", async () => {
		mockSignUpEmail.mockRejectedValueOnce(new Error("PASSWORD_COMPROMISED"));
		render(<HomepageSignupForm />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test User" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword123" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "securepassword123" },
		});
		fireEvent.submit(screen.getByTestId("homepage-signup-form"));

		await waitFor(() => {
			expect(
				screen.getByText(
					"This password has appeared in a data breach. Please choose a different password.",
				),
			).toBeInTheDocument();
		});
	});

	it("displays server error with role='alert'", async () => {
		mockSignUpEmail.mockRejectedValueOnce(new Error("Something went wrong"));
		render(<HomepageSignupForm />);

		fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test User" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "securepassword123" },
		});
		fireEvent.change(screen.getByLabelText("Confirm Password"), {
			target: { value: "securepassword123" },
		});
		fireEvent.submit(screen.getByTestId("homepage-signup-form"));

		await waitFor(() => {
			const alert = screen.getByRole("alert");
			expect(alert).toBeInTheDocument();
			expect(alert).toHaveTextContent("Something went wrong");
		});
	});
});
