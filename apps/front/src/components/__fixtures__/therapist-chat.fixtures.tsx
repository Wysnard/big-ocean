import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { vi } from "vitest";

// Default mock return values
export const mockSendMessage = vi.fn();
export const mockClearError = vi.fn();
export const mockRetryLastMessage = vi.fn();

export let mockHookReturn = {
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
	freeTierMessageThreshold: 27,
	// Story 7.18: Farewell transition state
	isFarewellReceived: false,
	portraitWaitMinMs: undefined as number | undefined,
};

export function resetMockHookReturn() {
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
		progressPercent: 0,
		freeTierMessageThreshold: 27,
		hasShownCelebration: false,
		setHasShownCelebration: vi.fn(),
		isFarewellReceived: false,
		portraitWaitMinMs: undefined,
	};
}

vi.mock("@/hooks/useTherapistChat", () => ({
	useTherapistChat: () => mockHookReturn,
}));

// Mock TanStack Router useNavigate and Link
export const mockNavigate = vi.fn();
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

// Mock chat-placeholders
vi.mock("@/constants/chat-placeholders", () => ({
	getPlaceholder: () => "What comes to mind first?",
}));

// Mock auth hook (used by ChatAuthGate)
vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({
		signUp: { email: vi.fn() },
		signIn: { email: vi.fn() },
		refreshSession: vi.fn(),
	}),
}));

export const queryClient = new QueryClient({
	defaultOptions: { queries: { retry: false } },
});

export function renderWithProviders(component: React.ReactElement) {
	return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

export function setupMatchMedia() {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}
