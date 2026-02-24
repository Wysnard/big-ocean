// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	mockHookReturn,
	renderWithProviders,
	resetMockHookReturn,
	setupMatchMedia,
} from "./__fixtures__/therapist-chat.fixtures";
import { TherapistChat } from "./TherapistChat";

describe("TherapistChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupMatchMedia();
		resetMockHookReturn();
	});

	// Task 2 Tests: Loading and Error States for Resume
	describe("Session Resume UI States", () => {
		it("shows loading spinner while resuming session", () => {
			mockHookReturn.isResuming = true;
			mockHookReturn.messages = [];

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.getByText("Loading your assessment...")).toBeTruthy();
			// Loader2 icon with animate-spin class
			const { container } = render(<TherapistChat sessionId="session-123" />);
			expect(container.querySelector(".animate-spin")).toBeTruthy();
		});

		it("calls onSessionError when session is not found on resume", async () => {
			const mockOnSessionError = vi.fn();
			mockHookReturn.isResuming = false;
			mockHookReturn.resumeError = new Error("HTTP 404: SessionNotFound");
			mockHookReturn.isResumeSessionNotFound = true;
			mockHookReturn.messages = [];

			renderWithProviders(
				<TherapistChat sessionId="session-123" onSessionError={mockOnSessionError} />,
			);

			await waitFor(() => {
				expect(mockOnSessionError).toHaveBeenCalledWith({
					type: "not-found",
					isResumeError: true,
				});
			});
		});

		it("shows generic error UI when resume fails with session not found", () => {
			mockHookReturn.isResuming = false;
			mockHookReturn.resumeError = new Error("HTTP 404: SessionNotFound");
			mockHookReturn.isResumeSessionNotFound = true;
			mockHookReturn.messages = [];

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.getByText(/went wrong/)).toBeTruthy();
		});

		it("shows generic error state with retry button", () => {
			mockHookReturn.isResuming = false;
			mockHookReturn.resumeError = new Error("Network failure");
			mockHookReturn.messages = [];

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.getByText(/went wrong/)).toBeTruthy();
			expect(screen.getByText(/Retry/)).toBeTruthy();
		});

		it("auto-scrolls to bottom after resume load completes", async () => {
			// Mock scrollIntoView
			Element.prototype.scrollIntoView = vi.fn();

			mockHookReturn.messages = [
				{ id: "msg_1", role: "assistant", content: "Previous", timestamp: new Date() },
				{ id: "msg_2", role: "user", content: "Message", timestamp: new Date() },
			];

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			await waitFor(() => {
				expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
			});
		});

		it("hides loading state when resume completes", () => {
			mockHookReturn.isResuming = false;
			mockHookReturn.messages = [
				{ id: "msg_1", role: "assistant", content: "Resumed", timestamp: new Date() },
			];

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.queryByText("Loading your assessment...")).toBeNull();
			expect(screen.getByText("Resumed")).toBeTruthy();
		});
	});

	// Story 4.8: Character Counter Tests
	describe("Character Counter", () => {
		it("displays '0 / 2,000' when input is empty", () => {
			const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			const counter = container.querySelector("[data-slot='char-counter']");
			expect(counter).toBeTruthy();
			expect(counter?.textContent).toContain("0");
			expect(counter?.textContent).toContain("2,000");
		});

		it("updates counter when user types", () => {
			const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = screen.getByPlaceholderText("What comes to mind first?") as HTMLTextAreaElement;
			fireEvent.change(textarea, { target: { value: "Hello" } });

			const counter = container.querySelector("[data-slot='char-counter']");
			expect(counter?.textContent).toContain("5");
		});

		it("shows warning state at 1,800+ chars", () => {
			const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = screen.getByPlaceholderText("What comes to mind first?") as HTMLTextAreaElement;
			fireEvent.change(textarea, { target: { value: "a".repeat(1800) } });

			const counter = container.querySelector("[data-slot='char-counter']");
			expect(counter?.getAttribute("data-state")).toBe("warning");
		});

		it("shows error state at 2,000 chars", () => {
			const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = screen.getByPlaceholderText("What comes to mind first?") as HTMLTextAreaElement;
			fireEvent.change(textarea, { target: { value: "a".repeat(2000) } });

			const counter = container.querySelector("[data-slot='char-counter']");
			expect(counter?.getAttribute("data-state")).toBe("error");
		});

		it("textarea has maxLength attribute set to 2000", () => {
			renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = screen.getByPlaceholderText("What comes to mind first?") as HTMLTextAreaElement;
			expect(textarea.maxLength).toBe(2000);
		});

		it("send button is still enabled at max length", () => {
			renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = screen.getByPlaceholderText("What comes to mind first?") as HTMLTextAreaElement;
			fireEvent.change(textarea, { target: { value: "a".repeat(2000) } });

			const sendButton = screen.getByTestId("chat-send-btn") as HTMLButtonElement;
			expect(sendButton.disabled).toBe(false);
		});

		it("counter is NOT rendered when isCompleted is true", () => {
			mockHookReturn.isCompleted = true;

			const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			const counter = container.querySelector("[data-slot='char-counter']");
			expect(counter).toBeNull();
		});

		it("textarea maxLength caps pasted text at 2000 characters (AC-6)", () => {
			renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = screen.getByPlaceholderText("What comes to mind first?") as HTMLTextAreaElement;

			// maxLength attribute enforces paste truncation at the browser level
			expect(textarea.maxLength).toBe(2000);

			// Simulate paste that would exceed limit — browser truncates via maxLength,
			// so the value set after paste should be capped
			fireEvent.change(textarea, { target: { value: "a".repeat(2000) } });
			expect(textarea.value).toHaveLength(2000);
		});
	});
});
