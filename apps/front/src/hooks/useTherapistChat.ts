import { useCallback, useEffect, useRef, useState } from "react";
import { AssessmentApiError, useResumeSession, useSendMessage } from "./use-assessment";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

interface TraitScores {
	openness: number;
	conscientiousness: number;
	extraversion: number;
	agreeableness: number;
	neuroticism: number;
}

/**
 * Parses API error responses into user-friendly messages.
 * Maps known HTTP status codes and error tags to actionable messages.
 */
function parseApiError(error: unknown): {
	message: string;
	type: "session" | "budget" | "rate-limit" | "limit-reached" | "network" | "generic";
} {
	if (error instanceof AssessmentApiError) {
		if (error.status === 403) {
			return {
				message: "You've reached the message limit. View your results!",
				type: "limit-reached",
			};
		}
		if (error.status === 404) {
			return { message: "Session not found. Starting a new session...", type: "session" };
		}
		if (error.status === 503) {
			return {
				message: "Assessment paused — daily budget reached. You can resume tomorrow.",
				type: "budget",
			};
		}
		if (error.status === 429) {
			return {
				message: "You've already started an assessment today. Come back tomorrow!",
				type: "rate-limit",
			};
		}
		if (error.status >= 500) {
			return { message: "Connection lost. Check your internet and try again.", type: "network" };
		}

		return { message: error.message, type: "generic" };
	}

	if (error instanceof Error) {
		const msg = error.message;

		if (msg.includes("404") || msg.includes("SessionNotFound")) {
			return { message: "Session not found. Starting a new session...", type: "session" };
		}
		if (msg.includes("503") || msg.includes("BudgetPaused") || msg.includes("CostLimit")) {
			return {
				message: "Assessment paused — daily budget reached. You can resume tomorrow.",
				type: "budget",
			};
		}
		if (msg.includes("429") || msg.includes("RateLimit")) {
			return {
				message: "You've already started an assessment today. Come back tomorrow!",
				type: "rate-limit",
			};
		}
		if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("ERR_")) {
			return { message: "Connection lost. Check your internet and try again.", type: "network" };
		}

		return { message: msg, type: "generic" };
	}

	return { message: "Something went wrong. Please try again.", type: "generic" };
}

/**
 * Hook for managing the therapist chat conversation with real API integration.
 * Handles session resumption, optimistic message updates, trait confidence scoring from backend,
 * and structured error handling for known API error types.
 */
export function useTherapistChat(sessionId: string) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [traits, setTraits] = useState<TraitScores>({
		openness: 0,
		conscientiousness: 0,
		extraversion: 0,
		agreeableness: 0,
		neuroticism: 0,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [errorType, setErrorType] = useState<
		"session" | "budget" | "rate-limit" | "limit-reached" | "network" | "generic" | null
	>(null);
	// Story 7.18: Farewell transition state
	const [isFarewellReceived, setIsFarewellReceived] = useState(false);
	const [farewellMessage, setFarewellMessage] = useState<string | null>(null);
	const [portraitWaitMinMs, setPortraitWaitMinMs] = useState<number | undefined>(undefined);
	const { mutate: sendMessageRpc } = useSendMessage();

	// Pending greeting messages not yet displayed (for stagger flush on early send)
	const pendingGreetingsRef = useRef<Message[]>([]);

	// Session resumption
	const {
		data: resumeData,
		isLoading: isResuming,
		error: resumeError,
	} = useResumeSession(sessionId);
	const isResumeSessionNotFound =
		resumeError instanceof AssessmentApiError
			? resumeError.status === 404
			: resumeError instanceof Error &&
				(resumeError.message.includes("404") || resumeError.message.includes("SessionNotFound"));

	// Initialize from resume data on mount
	useEffect(() => {
		if (!resumeData) return;

		// Map server messages to local Message type
		const mappedMessages = resumeData.messages.map((msg, index) => ({
			id: `msg-resume-${index}`,
			role: msg.role,
			content: msg.content,
			timestamp: new Date(msg.timestamp),
		}));

		// Load confidence scores (values are already 0-100, do NOT multiply)
		console.log("[BigOcean] Session resumed — confidence loaded", {
			sessionId,
			confidence: resumeData.confidence,
			messageCount: resumeData.messages.length,
		});

		setTraits({
			openness: resumeData.confidence.openness,
			conscientiousness: resumeData.confidence.conscientiousness,
			extraversion: resumeData.confidence.extraversion,
			agreeableness: resumeData.confidence.agreeableness,
			neuroticism: resumeData.confidence.neuroticism,
		});

		// Detect new session: exactly 3 assistant-only messages (server-persisted greeting)
		const isNewSession =
			mappedMessages.length === 3 && mappedMessages.every((m) => m.role === "assistant");

		if (!isNewSession) {
			// Resumed session with existing conversation — show all immediately
			setMessages(mappedMessages);
			return;
		}

		// Stagger greeting messages per AC #1: 0ms / 1200ms / 2000ms
		const prefersReducedMotion =
			typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (prefersReducedMotion) {
			setMessages(mappedMessages);
			return;
		}

		// First message appears immediately; remaining stagger in
		const [first, ...rest] = mappedMessages;
		setMessages([first]);
		pendingGreetingsRef.current = [...rest];

		const delays = [1200, 2000];
		const timeouts: ReturnType<typeof setTimeout>[] = [];

		rest.forEach((msg, i) => {
			timeouts.push(
				setTimeout(
					() => {
						pendingGreetingsRef.current = pendingGreetingsRef.current.filter((m) => m.id !== msg.id);
						setMessages((prev) => [...prev, msg]);
					},
					delays[i] ?? delays[delays.length - 1],
				),
			);
		});

		return () => {
			for (const t of timeouts) clearTimeout(t);
			pendingGreetingsRef.current = [];
		};
	}, [resumeData, sessionId]);

	const clearError = useCallback(() => {
		setErrorMessage(null);
		setErrorType(null);
	}, []);

	const sendMessage = useCallback(
		async (userMessage?: string) => {
			if (!sessionId || !userMessage) return;

			// Flush any pending staggered greeting messages before user's message
			if (pendingGreetingsRef.current.length > 0) {
				const remaining = [...pendingGreetingsRef.current];
				pendingGreetingsRef.current = [];
				setMessages((prev) => [...prev, ...remaining]);
			}

			clearError();
			setIsLoading(true);

			// Optimistic update: add user message immediately
			setMessages((prev) => [
				...prev,
				{
					id: `msg-${Date.now()}`,
					role: "user",
					content: userMessage,
					timestamp: new Date(),
				},
			]);

			sendMessageRpc(
				{ sessionId, message: userMessage },
				{
					onSuccess: (data) => {
						// Add assistant response
						setMessages((prev) => [
							...prev,
							{
								id: `msg-${Date.now()}-response`,
								role: "assistant",
								content: data.response,
								timestamp: new Date(),
							},
						]);

						// Story 7.18: Handle final turn — trigger farewell transition
						if (data.isFinalTurn) {
							setIsFarewellReceived(true);
							setFarewellMessage(data.farewellMessage ?? null);
							setPortraitWaitMinMs(data.portraitWaitMinMs);
						}

						// Story 2.11: confidence no longer in send-message response.
						// Traits are only updated from resume-session (which still returns confidence).

						setIsLoading(false);
					},
					onError: (error) => {
						const parsed = parseApiError(error);
						setErrorMessage(parsed.message);
						setErrorType(parsed.type);
						setIsLoading(false);
					},
				},
			);
		},
		[sessionId, sendMessageRpc, clearError],
	);

	const retryLastMessage = useCallback(() => {
		const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
		if (lastUserMessage) {
			// Remove the last user message (will be re-added by sendMessage)
			setMessages((prev) => prev.filter((m) => m.id !== lastUserMessage.id));
			sendMessage(lastUserMessage.content);
		}
	}, [messages, sendMessage]);

	// Story 4.7: Message-count-based progress — threshold driven by backend config
	const FREE_TIER_THRESHOLD = resumeData?.freeTierMessageThreshold ?? 25;
	const userMessageCount = messages.filter((m) => m.role === "user").length;
	const progressPercent = Math.min(Math.round((userMessageCount / FREE_TIER_THRESHOLD) * 100), 100);
	const isConfidenceReady = userMessageCount >= FREE_TIER_THRESHOLD;

	return {
		messages,
		traits,
		isLoading,
		isCompleted: userMessageCount >= FREE_TIER_THRESHOLD,
		errorMessage,
		errorType,
		clearError,
		retryLastMessage,
		sendMessage,
		isResuming,
		resumeError,
		isResumeSessionNotFound,
		isConfidenceReady,
		progressPercent,
		freeTierMessageThreshold: FREE_TIER_THRESHOLD,
		// Story 7.18: Farewell transition state
		isFarewellReceived,
		farewellMessage,
		portraitWaitMinMs,
	};
}
