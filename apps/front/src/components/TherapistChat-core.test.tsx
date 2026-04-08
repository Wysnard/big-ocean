// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	mockHookReturn,
	mockSendMessage,
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

	it("renders initial Nerin greeting", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getAllByText(/Nerin/).length).toBeGreaterThan(0);
	});

	it("displays Nerin name in header instead of session ID", () => {
		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		const header = container.querySelector('[data-slot="chat-header"]');
		expect(header).toBeTruthy();
		// Nerin name should be in header
		expect(header?.textContent).toContain("Nerin");
		// Session ID should NOT be displayed
		expect(screen.queryByText("session-123")).toBeNull();
	});

	it("renders textarea input field with rotating placeholder", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const textarea = screen.getByPlaceholderText("What comes to mind first?");
		expect(textarea).toBeTruthy();
		expect(textarea.tagName.toLowerCase()).toBe("textarea");
	});

	it("allows user to type in textarea", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const textarea = screen.getByPlaceholderText("What comes to mind first?") as HTMLTextAreaElement;
		fireEvent.change(textarea, { target: { value: "I love hiking" } });

		expect(textarea.value).toBe("I love hiking");
	});

	it("calls sendMessage when send button is clicked", async () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const textarea = screen.getByPlaceholderText("What comes to mind first?") as HTMLTextAreaElement;
		fireEvent.change(textarea, { target: { value: "I love hiking" } });

		const sendButton = screen.getAllByRole("button").find((btn) => !btn.getAttribute("aria-label"));
		if (sendButton) {
			fireEvent.click(sendButton);
		}

		await waitFor(() => {
			expect(mockSendMessage).toHaveBeenCalledWith("I love hiking");
		});
	});

	it("calls sendMessage on Enter key press", async () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const textarea = screen.getByPlaceholderText("What comes to mind first?");
		fireEvent.change(textarea, { target: { value: "I love reading" } });
		fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

		await waitFor(() => {
			expect(mockSendMessage).toHaveBeenCalledWith("I love reading");
		});
	});

	it("shows typing indicator when loading", () => {
		mockHookReturn.isLoading = true;

		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		// Typing indicator uses motion-safe:animate-bounce spans
		const bouncingDots = container.querySelectorAll("[class*='animate-bounce']");
		expect(bouncingDots.length).toBe(3);
	});

	it("does not show typing indicator when not loading", () => {
		mockHookReturn.isLoading = false;

		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		const bouncingDots = container.querySelectorAll("[class*='animate-bounce']");
		expect(bouncingDots.length).toBe(0);
	});

	it("displays error banner when resumeError is set", () => {
		mockHookReturn.resumeError = new Error("Something went wrong");

		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getByText("Something went wrong")).toBeTruthy();
	});

	it("shows retry button when resumeError is set", () => {
		mockHookReturn.resumeError = new Error("Connection lost");

		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getByText("Retry")).toBeTruthy();
	});

	it("adds data-message-id attribute to messages", () => {
		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		const messageEl = container.querySelector("[data-message-id='msg_1']");
		expect(messageEl).toBeTruthy();
	});

	it("user messages render as non-interactive div elements", () => {
		mockHookReturn.messages = [
			{
				id: "msg_user",
				role: "user",
				content: "My message",
				timestamp: new Date(),
			},
		];

		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		const userMessage = container.querySelector("[data-message-id='msg_user']");
		expect(userMessage?.tagName.toLowerCase()).toBe("div");
	});

	it("disables textarea when loading", () => {
		mockHookReturn.isLoading = true;

		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const textarea = screen.getByPlaceholderText("What comes to mind first?") as HTMLTextAreaElement;
		expect(textarea.disabled).toBe(true);
	});

	it("renders NerinMessage with avatar next to assistant messages", () => {
		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		// NerinMessage renders a chat-bubble wrapper with a gradient avatar containing "N"
		const bubbles = container.querySelectorAll("[data-slot='chat-bubble']");
		expect(bubbles.length).toBeGreaterThan(0);
	});

	it("renders the shared 25% milestone badge after the fourth user turn", async () => {
		mockHookReturn.messages = [
			{ id: "msg_1", role: "assistant", content: "Q1", timestamp: new Date() },
			{ id: "msg_2", role: "user", content: "A1", timestamp: new Date() },
			{ id: "msg_3", role: "assistant", content: "Q2", timestamp: new Date() },
			{ id: "msg_4", role: "user", content: "A2", timestamp: new Date() },
			{ id: "msg_5", role: "assistant", content: "Q3", timestamp: new Date() },
			{ id: "msg_6", role: "user", content: "A3", timestamp: new Date() },
			{ id: "msg_7", role: "assistant", content: "Q4", timestamp: new Date() },
			{ id: "msg_8", role: "user", content: "A4", timestamp: new Date() },
		];

		renderWithProviders(<TherapistChat sessionId="session-123" />);

		await waitFor(() => {
			expect(
				screen.getByText("🫧 Great start — your personality portrait is beginning to emerge."),
			).toBeInTheDocument();
		});
	});
});
