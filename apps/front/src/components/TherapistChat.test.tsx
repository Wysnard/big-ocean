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
	},
	isLoading: false,
	isCompleted: false,
	errorMessage: null as string | null,
	errorType: null as string | null,
	clearError: mockClearError,
	retryLastMessage: mockRetryLastMessage,
	sendMessage: mockSendMessage,
	isResuming: false,
	resumeError: null as Error | null,
	isResumeSessionNotFound: false,
	isConfidenceReady: false,
	progressPercent: 0,
	hasShownCelebration: false,
	setHasShownCelebration: vi.fn(),
};

vi.mock("@/hooks/useTherapistChat", () => ({
	useTherapistChat: () => mockHookReturn,
}));

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => mockUseAuth(),
}));

// Mock TanStack Router useNavigate and Link
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
	Link: ({
		children,
		to,
		...props
	}: {
		children: React.ReactNode;
		to: string;
		[key: string]: unknown;
	}) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

// Mock SignUpModal
vi.mock("./auth/SignUpModal", () => ({
	SignUpModal: () => null,
}));

// Mock chat-placeholders
vi.mock("@/constants/chat-placeholders", () => ({
	getPlaceholder: () => "What comes to mind first?",
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
		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: null,
			session: null,
			isPending: false,
		});
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
			},
			isLoading: false,
			isCompleted: false,
			errorMessage: null,
			errorType: null,
			clearError: mockClearError,
			retryLastMessage: mockRetryLastMessage,
			sendMessage: mockSendMessage,
			isResuming: false,
			resumeError: null,
			isResumeSessionNotFound: false,
			isConfidenceReady: false,
			hasShownCelebration: false,
			setHasShownCelebration: vi.fn(),
		};
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

		it("shows SessionNotFound error with redirect button", () => {
			mockUseAuth.mockReturnValue({
				isAuthenticated: false,
				user: null,
				session: null,
				isPending: false,
			});
			mockHookReturn.isResuming = false;
			mockHookReturn.resumeError = new Error("HTTP 404: SessionNotFound");
			mockHookReturn.isResumeSessionNotFound = true;
			mockHookReturn.messages = [];

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.getByText("Session not found")).toBeTruthy();
			expect(screen.getByText("Start New Assessment")).toBeTruthy();
		});

		it("redirects authenticated users to 404 when resume access is denied", async () => {
			mockHookReturn.isResuming = false;
			mockHookReturn.resumeError = new Error("HTTP 404: SessionNotFound");
			mockHookReturn.isResumeSessionNotFound = true;
			mockHookReturn.messages = [];

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith({ to: "/404" });
			});
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

	// Task 4 Tests: In-Chat Celebration Card
	describe("70% Celebration Card", () => {
		it("shows celebration card when isConfidenceReady and not hasShownCelebration", () => {
			mockHookReturn.isConfidenceReady = true;
			mockHookReturn.hasShownCelebration = false;

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.getByText("Your Personality Profile is Ready!")).toBeTruthy();
			expect(screen.getByText("View Results")).toBeTruthy();
			expect(screen.getByText("Keep Exploring")).toBeTruthy();
		});

		it("hides celebration card if hasShownCelebration is true", () => {
			mockHookReturn.isConfidenceReady = true;
			mockHookReturn.hasShownCelebration = true;

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.queryByText("Your Personality Profile is Ready!")).toBeNull();
		});

		it("hides celebration card if isConfidenceReady is false", () => {
			mockHookReturn.isConfidenceReady = false;
			mockHookReturn.hasShownCelebration = false;

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.queryByText("Your Personality Profile is Ready!")).toBeNull();
		});

		it("navigates to results page when View Results clicked", async () => {
			mockHookReturn.isConfidenceReady = true;
			mockHookReturn.hasShownCelebration = false;

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			const viewResultsBtn = screen.getByText("View Results");
			fireEvent.click(viewResultsBtn);

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith({
					to: "/results/$sessionId",
					params: { sessionId: "session-123" },
				});
			});
		});

		it("dismisses card when Keep Exploring clicked", async () => {
			const mockSetHasShownCelebration = vi.fn();
			mockHookReturn.isConfidenceReady = true;
			mockHookReturn.hasShownCelebration = false;
			mockHookReturn.setHasShownCelebration = mockSetHasShownCelebration;

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			const keepExploringBtn = screen.getByText("Keep Exploring");
			fireEvent.click(keepExploringBtn);

			await waitFor(() => {
				expect(mockSetHasShownCelebration).toHaveBeenCalledWith(true);
			});
		});

		it("shows 'View Your Results' link in header when isConfidenceReady", () => {
			mockHookReturn.isConfidenceReady = true;

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.getByTestId("view-results-header-link")).toBeTruthy();
		});
	});

});
