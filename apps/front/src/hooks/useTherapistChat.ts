import { useCallback, useEffect, useState } from "react";
import { useResumeSession, useSendMessage } from "./use-assessment";

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
	opennessConfidence: number;
	conscientiousnessConfidence: number;
	extraversionConfidence: number;
	agreeablenessConfidence: number;
	neuroticismConfidence: number;
}

/**
 * Parses API error responses into user-friendly messages.
 * Maps known HTTP status codes and error tags to actionable messages.
 */
function parseApiError(error: unknown): {
	message: string;
	type: "session" | "budget" | "rate-limit" | "network" | "generic";
} {
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
		opennessConfidence: 0,
		conscientiousnessConfidence: 0,
		extraversionConfidence: 0,
		agreeablenessConfidence: 0,
		neuroticismConfidence: 0,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [errorType, setErrorType] = useState<
		"session" | "budget" | "rate-limit" | "network" | "generic" | null
	>(null);
	const [hasShownCelebration, setHasShownCelebration] = useState(false);
	const { mutate: sendMessageRpc } = useSendMessage();

	// Session resumption
	const {
		data: resumeData,
		isLoading: isResuming,
		error: resumeError,
	} = useResumeSession(sessionId);

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

		// If empty messages, show Nerin greeting
		if (mappedMessages.length === 0) {
			setMessages([
				{
					id: "msg_init",
					role: "assistant",
					content:
						"Hi! I'm Nerin, your AI therapist. I'd like to understand you better. Let's start with something simple: What are you currently passionate about?",
					timestamp: new Date(Date.now() - 5000),
				},
			]);
		} else {
			// Otherwise, use server messages
			setMessages(mappedMessages);
		}

		// Load confidence scores (values are already 0-100, do NOT multiply)
		setTraits({
			openness: resumeData.confidence.openness,
			conscientiousness: resumeData.confidence.conscientiousness,
			extraversion: resumeData.confidence.extraversion,
			agreeableness: resumeData.confidence.agreeableness,
			neuroticism: resumeData.confidence.neuroticism,
			opennessConfidence: resumeData.confidence.openness,
			conscientiousnessConfidence: resumeData.confidence.conscientiousness,
			extraversionConfidence: resumeData.confidence.extraversion,
			agreeablenessConfidence: resumeData.confidence.agreeableness,
			neuroticismConfidence: resumeData.confidence.neuroticism,
		});
	}, [resumeData]);

	const clearError = useCallback(() => {
		setErrorMessage(null);
		setErrorType(null);
	}, []);

	const sendMessage = useCallback(
		async (userMessage?: string) => {
			if (!sessionId || !userMessage) return;

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

						// Update trait confidence from API response (values are 0-100 integers)
						setTraits({
							openness: data.confidence.openness,
							conscientiousness: data.confidence.conscientiousness,
							extraversion: data.confidence.extraversion,
							agreeableness: data.confidence.agreeableness,
							neuroticism: data.confidence.neuroticism,
							opennessConfidence: data.confidence.openness,
							conscientiousnessConfidence: data.confidence.conscientiousness,
							extraversionConfidence: data.confidence.extraversion,
							agreeablenessConfidence: data.confidence.agreeableness,
							neuroticismConfidence: data.confidence.neuroticism,
						});

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

	// Calculate if confidence is ready (70%+ average)
	const avgConfidence =
		(traits.openness +
			traits.conscientiousness +
			traits.extraversion +
			traits.agreeableness +
			traits.neuroticism) /
		5;
	const isConfidenceReady = avgConfidence >= 70;

	return {
		messages,
		traits,
		isLoading,
		isCompleted: false,
		errorMessage,
		errorType,
		clearError,
		retryLastMessage,
		sendMessage,
		isResuming,
		resumeError,
		isConfidenceReady,
		hasShownCelebration,
		setHasShownCelebration,
	};
}
