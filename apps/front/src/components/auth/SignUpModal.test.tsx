/**
 * SignUpModal Component Tests
 *
 * Tests the sign-up modal that appears after first message.
 * Validates modal display, form submission, session linking, and dismissal.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpModal } from "./SignUpModal";

// Mock auth hook
const mockSignUpEmail = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => mockUseAuth(),
}));

// Create query client for tests
const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

function renderWithProviders(component: React.ReactElement) {
	const queryClient = createTestQueryClient();
	return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe("SignUpModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseAuth.mockReturnValue({
			signUp: { email: mockSignUpEmail },
			isAuthenticated: false,
			isPending: false,
			error: null,
		});
	});

	describe("Task 1: Modal Display", () => {
		it("renders with 'Save your results' heading when open", () => {
			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);
			expect(screen.getByText("Save your results?")).toBeTruthy();
		});

		it("displays motivational message about saving results", () => {
			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);
			expect(screen.getByText(/sign up to continue and keep your personality insights/i)).toBeTruthy();
		});

		it("does not render when isOpen is false", () => {
			const { container } = renderWithProviders(
				<SignUpModal isOpen={false} sessionId="test-session" onClose={() => {}} />,
			);
			// Dialog should not be visible
			expect(container.querySelector('[data-state="open"]')).toBeNull();
		});

		it("contains email and password input fields", () => {
			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);
			expect(screen.getByPlaceholderText(/email/i)).toBeTruthy();
			expect(screen.getByPlaceholderText(/at least 12 characters/i)).toBeTruthy();
		});

		it("has a 'Continue without account' dismiss button", () => {
			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);
			expect(screen.getByText(/continue without account/i)).toBeTruthy();
		});
	});

	describe("Task 3: Session Linking", () => {
		it("calls signUp.email with anonymousSessionId on form submit", async () => {
			mockSignUpEmail.mockResolvedValue({ success: true });

			renderWithProviders(
				<SignUpModal isOpen={true} sessionId="test-anonymous-session" onClose={() => {}} />,
			);

			// Fill out form
			fireEvent.change(screen.getByPlaceholderText(/email/i), {
				target: { value: "test@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText(/at least 12 characters/i), {
				target: { value: "SecurePassword123!" },
			});

			// Submit form
			const submitButton = screen.getByRole("button", { name: /sign up/i });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockSignUpEmail).toHaveBeenCalledWith(
					"test@example.com",
					"SecurePassword123!",
					undefined,
					"test-anonymous-session",
				);
			});
		});

		it("shows success message after successful signup", async () => {
			mockSignUpEmail.mockResolvedValue({ success: true });

			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);

			fireEvent.change(screen.getByPlaceholderText(/email/i), {
				target: { value: "test@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText(/at least 12 characters/i), {
				target: { value: "SecurePassword123!" },
			});

			fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

			await waitFor(
				() => {
					expect(screen.getByText(/your results are being saved/i)).toBeTruthy();
				},
				{ timeout: 2000 },
			);
		});

		it("closes modal after successful signup", async () => {
			const mockOnClose = vi.fn();
			mockSignUpEmail.mockResolvedValue({ success: true });

			renderWithProviders(
				<SignUpModal isOpen={true} sessionId="test-session" onClose={mockOnClose} />,
			);

			fireEvent.change(screen.getByPlaceholderText(/email/i), {
				target: { value: "test@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText(/at least 12 characters/i), {
				target: { value: "SecurePassword123!" },
			});

			fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

			// Wait for the 1.5 second delay + some buffer
			await waitFor(
				() => {
					expect(mockOnClose).toHaveBeenCalled();
				},
				{ timeout: 2000 },
			);
		});
	});

	describe("Task 4: Form Validation and UX", () => {
		it("validates password length (minimum 12 characters)", async () => {
			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);

			fireEvent.change(screen.getByPlaceholderText(/email/i), {
				target: { value: "test@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText(/at least 12 characters/i), {
				target: { value: "short" },
			});

			fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

			await waitFor(() => {
				expect(screen.getByText(/password must be at least 12 characters/i)).toBeTruthy();
			});

			// Should not call signUp
			expect(mockSignUpEmail).not.toHaveBeenCalled();
		});

		it("validates email format", async () => {
			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);

			const emailInput = screen.getByPlaceholderText(/email/i);
			const passwordInput = screen.getByPlaceholderText(/at least 12 characters/i);

			// Use invalid email that passes HTML5 but fails our regex
			fireEvent.change(emailInput, {
				target: { value: "notanemail" },
			});
			fireEvent.change(passwordInput, {
				target: { value: "SecurePassword123!" },
			});

			// Find and submit the form directly (bypasses HTML5 validation)
			const form = emailInput.closest("form");
			if (form) {
				fireEvent.submit(form);
			}

			await waitFor(
				() => {
					expect(screen.getByText(/please enter a valid email address/i)).toBeTruthy();
				},
				{ timeout: 1000 },
			);

			expect(mockSignUpEmail).not.toHaveBeenCalled();
		});

		it("shows loading state during signup", async () => {
			mockSignUpEmail.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)),
			);

			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);

			fireEvent.change(screen.getByPlaceholderText(/email/i), {
				target: { value: "test@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText(/at least 12 characters/i), {
				target: { value: "SecurePassword123!" },
			});

			fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

			// Should show loading state
			expect(screen.getByText(/signing up/i)).toBeTruthy();
		});

		it("displays error when email already exists", async () => {
			mockSignUpEmail.mockRejectedValue(new Error("Email already exists"));

			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);

			fireEvent.change(screen.getByPlaceholderText(/email/i), {
				target: { value: "existing@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText(/at least 12 characters/i), {
				target: { value: "SecurePassword123!" },
			});

			fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

			await waitFor(() => {
				expect(screen.getByText(/email already exists/i)).toBeTruthy();
			});
		});

		it("displays generic error on network failure", async () => {
			mockSignUpEmail.mockRejectedValue(new Error("Network error"));

			renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" onClose={() => {}} />);

			fireEvent.change(screen.getByPlaceholderText(/email/i), {
				target: { value: "test@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText(/at least 12 characters/i), {
				target: { value: "SecurePassword123!" },
			});

			fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

			await waitFor(() => {
				expect(screen.getByText(/network error/i)).toBeTruthy();
			});
		});
	});

	describe("Task 2: Modal Dismissal", () => {
		it("calls onClose when 'Continue without account' is clicked", () => {
			const mockOnClose = vi.fn();

			renderWithProviders(
				<SignUpModal isOpen={true} sessionId="test-session" onClose={mockOnClose} />,
			);

			const dismissButton = screen.getByText(/continue without account/i);
			fireEvent.click(dismissButton);

			expect(mockOnClose).toHaveBeenCalled();
		});

		it("allows dismissing modal with X button", () => {
			const mockOnClose = vi.fn();

			renderWithProviders(
				<SignUpModal isOpen={true} sessionId="test-session" onClose={mockOnClose} />,
			);

			// Find close button (X icon)
			const closeButton = screen.getByRole("button", { name: /close/i });
			fireEvent.click(closeButton);

			expect(mockOnClose).toHaveBeenCalled();
		});
	});
});
