import { vi } from "vitest";

/**
 * Simulates the 3 greeting messages that the backend now persists during startAssessment.
 * These are returned by the resume endpoint for new sessions.
 */
export const SERVER_GREETING_MESSAGES = [
	{
		role: "assistant" as const,
		content:
			"Hey there! I'm Nerin — I'm here to help you understand your personality through conversation. No multiple choice, no right answers, just us talking.",
		timestamp: "2026-02-01T10:00:00Z",
	},
	{
		role: "assistant" as const,
		content:
			"Here's the thing: the more openly and honestly you share, the more accurate and meaningful your insights will be. This is a judgment-free space — be as real as you'd like. The honest answer, even if it's messy or contradictory, is always more valuable than the polished one.",
		timestamp: "2026-02-01T10:00:01Z",
	},
	{
		role: "assistant" as const,
		content: "If your closest friend described you in three words, what would they say?",
		timestamp: "2026-02-01T10:00:02Z",
	},
];

export function setupDefaultMocks(mockResumeSession: ReturnType<typeof vi.fn>) {
	// Mock matchMedia for greeting stagger reduced-motion detection
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

	// Default mock: new session with 3 server-persisted greeting messages
	mockResumeSession.mockReturnValue({
		data: {
			messages: SERVER_GREETING_MESSAGES,
			confidence: {
				openness: 0,
				conscientiousness: 0,
				extraversion: 0,
				agreeableness: 0,
				neuroticism: 0,
			},
		},
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	});
}
