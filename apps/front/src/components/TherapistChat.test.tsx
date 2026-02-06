// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TherapistChat } from "./TherapistChat";

// Default mock return values
const mockSendMessage = vi.fn();
const mockClearError = vi.fn();
const mockRetryLastMessage = vi.fn();

let mockHookReturn = {
	messages: [
		{
			id: "msg_1",
			role: "assistant" as const,
			content: "Hi! I'm Nerin, your AI therapist. What are you currently passionate about?",
			timestamp: new Date(),
		},
	],
	traits: {
		openness: 0,
		conscientiousness: 0,
		extraversion: 0,
		agreeableness: 0,
		neuroticism: 0,
		opennessPrecision: 0,
		conscientiousnessPrecision: 0,
		extraversionPrecision: 0,
		agreeablenessPrecision: 0,
		neuroticismPrecision: 0,
	},
	isLoading: false,
	isCompleted: false,
	errorMessage: null as string | null,
	errorType: null as string | null,
	clearError: mockClearError,
	retryLastMessage: mockRetryLastMessage,
	sendMessage: mockSendMessage,
};

vi.mock("@/hooks/useTherapistChat", () => ({
	useTherapistChat: () => mockHookReturn,
}));

// Mock useAuth
vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({
		isAuthenticated: true,
		user: null,
		session: null,
		isPending: false,
	}),
}));

// Mock TanStack Router useNavigate
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

// Mock SignUpModal
vi.mock("./auth/SignUpModal", () => ({
	SignUpModal: () => null,
}));

const queryClient = new QueryClient({
	defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(component: React.ReactElement) {
	return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe("TherapistChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockHookReturn = {
			messages: [
				{
					id: "msg_1",
					role: "assistant",
					content: "Hi! I'm Nerin, your AI therapist. What are you currently passionate about?",
					timestamp: new Date(),
				},
			],
			traits: {
				openness: 0,
				conscientiousness: 0,
				extraversion: 0,
				agreeableness: 0,
				neuroticism: 0,
				opennessPrecision: 0,
				conscientiousnessPrecision: 0,
				extraversionPrecision: 0,
				agreeablenessPrecision: 0,
				neuroticismPrecision: 0,
			},
			isLoading: false,
			isCompleted: false,
			errorMessage: null,
			errorType: null,
			clearError: mockClearError,
			retryLastMessage: mockRetryLastMessage,
			sendMessage: mockSendMessage,
		};
	});

	it("renders initial Nerin greeting", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getByText(/Nerin/)).toBeTruthy();
	});

	it("displays session ID in header", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getByText(/session-123/)).toBeTruthy();
	});

	it("renders trait precision scores in sidebar", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getByText("Openness")).toBeTruthy();
		expect(screen.getByText("Conscientiousness")).toBeTruthy();
		expect(screen.getByText("Extraversion")).toBeTruthy();
		expect(screen.getByText("Agreeableness")).toBeTruthy();
		expect(screen.getByText("Neuroticism")).toBeTruthy();
		expect(screen.getByText("Current Scores")).toBeTruthy();
	});

	it("renders message input field", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getByPlaceholderText("Type your response here...")).toBeTruthy();
	});

	it("allows user to type in input field", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const input = screen.getByPlaceholderText("Type your response here...") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "I love hiking" } });

		expect(input.value).toBe("I love hiking");
	});

	it("calls sendMessage when send button is clicked", async () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const input = screen.getByPlaceholderText("Type your response here...") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "I love hiking" } });

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

		const input = screen.getByPlaceholderText("Type your response here...");
		fireEvent.change(input, { target: { value: "I love reading" } });
		fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

		await waitFor(() => {
			expect(mockSendMessage).toHaveBeenCalledWith("I love reading");
		});
	});

	it("shows typing indicator when loading", () => {
		mockHookReturn.isLoading = true;

		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		// Typing indicator has animate-bounce spans
		const bouncingDots = container.querySelectorAll(".animate-bounce");
		expect(bouncingDots.length).toBe(3);
	});

	it("does not show typing indicator when not loading", () => {
		mockHookReturn.isLoading = false;

		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		const bouncingDots = container.querySelectorAll(".animate-bounce");
		expect(bouncingDots.length).toBe(0);
	});

	it("displays error banner when errorMessage is set", () => {
		mockHookReturn.errorMessage = "Something went wrong";
		mockHookReturn.errorType = "generic";

		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getByText("Something went wrong")).toBeTruthy();
	});

	it("shows retry button for network errors", () => {
		mockHookReturn.errorMessage = "Connection lost";
		mockHookReturn.errorType = "network";

		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getByText("Retry")).toBeTruthy();
	});

	it("does not show retry button for budget errors", () => {
		mockHookReturn.errorMessage = "Budget reached";
		mockHookReturn.errorType = "budget";

		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.queryByText("Retry")).toBeNull();
	});

	it("adds data-message-id attribute to messages", () => {
		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		const messageEl = container.querySelector("[data-message-id='msg_1']");
		expect(messageEl).toBeTruthy();
	});

	it("fires onMessageClick when user message is clicked", () => {
		const onMessageClick = vi.fn();

		mockHookReturn.messages = [
			{
				id: "msg_1",
				role: "assistant",
				content: "Hello!",
				timestamp: new Date(),
			},
			{
				id: "msg_2",
				role: "user",
				content: "Hi there",
				timestamp: new Date(),
			},
		];

		const { container } = renderWithProviders(
			<TherapistChat sessionId="session-123" onMessageClick={onMessageClick} />,
		);

		const userMessage = container.querySelector("[data-message-id='msg_2']");
		if (userMessage) {
			fireEvent.click(userMessage);
		}

		expect(onMessageClick).toHaveBeenCalledWith("msg_2");
	});

	it("does not fire onMessageClick for assistant messages", () => {
		const onMessageClick = vi.fn();

		const { container } = renderWithProviders(
			<TherapistChat sessionId="session-123" onMessageClick={onMessageClick} />,
		);

		const assistantMessage = container.querySelector("[data-message-id='msg_1']");
		if (assistantMessage) {
			fireEvent.click(assistantMessage);
		}

		expect(onMessageClick).not.toHaveBeenCalled();
	});

	it("user messages render as button elements for accessibility", () => {
		mockHookReturn.messages = [
			{
				id: "msg_user",
				role: "user",
				content: "My message",
				timestamp: new Date(),
			},
		];

		const { container } = renderWithProviders(
			<TherapistChat sessionId="session-123" onMessageClick={() => {}} />,
		);

		const userMessage = container.querySelector("[data-message-id='msg_user']");
		expect(userMessage?.tagName.toLowerCase()).toBe("button");
	});

	it("disables input when loading", () => {
		mockHookReturn.isLoading = true;

		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const input = screen.getByPlaceholderText("Type your response here...") as HTMLInputElement;
		expect(input.disabled).toBe(true);
	});

	it("sidebar is hidden on mobile, has floating button", () => {
		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		// Desktop sidebar has hidden md:flex
		const sidebar = container.querySelector(".hidden.md\\:flex.md\\:w-80");
		expect(sidebar).toBeTruthy();

		// Mobile floating button exists
		const mobileButton = screen.getByLabelText("Show trait scores");
		expect(mobileButton).toBeTruthy();
	});
});
