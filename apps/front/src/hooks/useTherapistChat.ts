import { useCallback, useState } from "react";
import { useSendMessage } from "./use-assessment";

/**
 * Represents a single message in the chat conversation.
 * Includes both client-side timestamp and optional server-side timestamp for compatibility.
 */
interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	createdAt?: string;
}

/**
 * Trait precision scores for the Big Five personality model.
 * Stores both decimal (0-1) and percentage (0-100) representations for UI convenience.
 * Decimal values (openness, conscientiousness, etc.) are used for calculations.
 * Percentage values (opennessPrecision, etc.) are pre-calculated for UI display.
 */
interface TraitScores {
	openness: number;
	conscientiousness: number;
	extraversion: number;
	agreeableness: number;
	neuroticism: number;
	opennessPrecision: number;
	conscientiousnessPrecision: number;
	extraversionPrecision: number;
	agreeablenessPrecision: number;
	neuroticismPrecision: number;
}

/**
 * Generates deterministic mock responses based on user input keywords.
 * Used for demo/mocking before real RPC integration. Responses are semantic
 * and contextual based on keywords detected in user messages.
 *
 * @example
 * generateMockResponse("I love hiking") // Returns adventure-themed response
 * generateMockResponse("Work is challenging") // Returns challenge-themed response
 */
function generateMockResponse(userMessage: string): string {
	const responses: { [key: string]: string[] } = {
		adventure: [
			"That adventurous nature often correlates with high openness to experience. Do you find yourself seeking out novel experiences in other ways too?",
			"I'm curious — when things don't go as planned during an adventure, how do you typically react?",
		],
		challenge: [
			"Interesting. It sounds like you enjoy pushing yourself. How do you usually handle setbacks when pursuing these challenges?",
			"Do you apply that same challenge-seeking approach to your personal and professional goals?",
		],
		creative: [
			"Creativity is fascinating. How important is it for you to express your creative side in your daily life?",
			"Do you see creativity as something essential to your happiness, or more as an occasional outlet?",
		],
		relationship: [
			"Relationships are central to who we are. How would your close friends describe you?",
			"Do you find it easy to open up to people, or do you prefer to keep things more private?",
		],
		work: [
			"Work takes up a significant portion of our lives. What aspects of your work are most fulfilling?",
			"Do you prefer structure and planning, or do you like more flexibility in how you approach tasks?",
		],
		default: [
			"Tell me more about that. What draws you to this interest?",
			"That's insightful. Do you find that this applies to other areas of your life as well?",
			"I appreciate you sharing that. How would you say this shapes who you are?",
		],
	};

	const lowerInput = userMessage.toLowerCase();
	if (
		lowerInput.includes("adventure") ||
		lowerInput.includes("discover") ||
		lowerInput.includes("explore")
	) {
		return responses.adventure[Math.floor(Math.random() * responses.adventure.length)];
	}
	if (
		lowerInput.includes("challenge") ||
		lowerInput.includes("difficult") ||
		lowerInput.includes("hard")
	) {
		return responses.challenge[Math.floor(Math.random() * responses.challenge.length)];
	}
	if (
		lowerInput.includes("create") ||
		lowerInput.includes("creative") ||
		lowerInput.includes("art")
	) {
		return responses.creative[Math.floor(Math.random() * responses.creative.length)];
	}
	if (
		lowerInput.includes("friend") ||
		lowerInput.includes("relation") ||
		lowerInput.includes("people")
	) {
		return responses.relationship[Math.floor(Math.random() * responses.relationship.length)];
	}
	if (lowerInput.includes("work") || lowerInput.includes("job") || lowerInput.includes("career")) {
		return responses.work[Math.floor(Math.random() * responses.work.length)];
	}

	return responses.default[Math.floor(Math.random() * responses.default.length)];
}

/**
 * Hook for managing mocked therapist chat state and interactions.
 * Handles message history, trait precision scores, and simulated assistant responses.
 *
 * This is a mock implementation for Story 1.5 (frontend mockup). In production (Epic 4+),
 * this will be replaced with real RPC calls via useSendMessage hook.
 * Returns an object with messages array, trait scores, loading state, and sendMessage callback.
 *
 * @example
 * const { messages, traits, isLoading, sendMessage } = useTherapistChat('session-123')
 * await sendMessage('I love hiking')
 */
export function useTherapistChat(sessionId: string) {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "msg_init",
			role: "assistant",
			content:
				"Hi! I'm Nerin, your AI therapist. I'd like to understand you better. Let's start with something simple: What are you currently passionate about?",
			timestamp: new Date(Date.now() - 5000),
		},
	]);
	const [traits, setTraits] = useState<TraitScores>({
		openness: 0.58,
		conscientiousness: 0.42,
		extraversion: 0.55,
		agreeableness: 0.51,
		neuroticism: 0.38,
		opennessPrecision: 58,
		conscientiousnessPrecision: 42,
		extraversionPrecision: 55,
		agreeablenessPrecision: 51,
		neuroticismPrecision: 38,
	});
	const [isLoading, setIsLoading] = useState(false);
	const { mutate: sendMessageRpc, isPending: isRpcPending } = useSendMessage();

	/**
	 * Sends a user message and triggers a mocked assistant response.
	 * Optimistically adds the user message, then waits 1-2 seconds before
	 * adding the assistant's response. Trait scores update with each exchange.
	 *
	 * @example
	 * await sendMessage('What does it mean to be creative?')
	 * // User message appears immediately
	 * // After 1-2 seconds, Nerin's response appears
	 * // Trait scores update
	 */
	const sendMessage = useCallback(
		async (userMessage?: string) => {
			if (!sessionId || !userMessage) return;

			setIsLoading(true);

			// Add user message immediately (optimistic update)
			setMessages((prev) => [
				...prev,
				{
					id: `msg-${Date.now()}`,
					role: "user",
					content: userMessage,
					timestamp: new Date(),
				},
			]);

			try {
				// Send to RPC (which will return mock data for now)
				sendMessageRpc(
					{ sessionId, message: userMessage },
					{
						onSuccess: (data) => {
							// Simulate network delay for mock
							setTimeout(
								() => {
									// Add assistant message from RPC response (or mock)
									const mockResponse = data.response || generateMockResponse(userMessage);
									setMessages((prev) => [
										...prev,
										{
											id: `msg-${Date.now()}-response`,
											role: "assistant",
											content: mockResponse,
											timestamp: new Date(),
										},
									]);

									// Update trait precision from RPC response
									if (data.precision) {
										setTraits({
											openness: data.precision.openness,
											conscientiousness: data.precision.conscientiousness,
											extraversion: data.precision.extraversion,
											agreeableness: data.precision.agreeableness,
											neuroticism: data.precision.neuroticism,
											opennessPrecision: Math.round(data.precision.openness * 100),
											conscientiousnessPrecision: Math.round(data.precision.conscientiousness * 100),
											extraversionPrecision: Math.round(data.precision.extraversion * 100),
											agreeablenessPrecision: Math.round(data.precision.agreeableness * 100),
											neuroticismPrecision: Math.round(data.precision.neuroticism * 100),
										});
									}

									setIsLoading(false);
								},
								1000 + Math.random() * 1000,
							); // 1-2 second delay
						},
						onError: (error) => {
							console.error("Failed to send message:", error);
							// Fallback to mock response if RPC fails
							const mockResponse = generateMockResponse(userMessage);
							setMessages((prev) => [
								...prev,
								{
									id: `msg-${Date.now()}-response`,
									role: "assistant",
									content: mockResponse,
									timestamp: new Date(),
								},
							]);

							// Update with mock trait updates - calculate decimals first, then percentages for consistency
							setTraits((prev) => {
								const newOpenness = Math.min(prev.openness + Math.random() * 0.04, 0.95);
								const newConscientiousness = Math.min(prev.conscientiousness + Math.random() * 0.04, 0.95);
								const newExtraversion = Math.min(prev.extraversion + Math.random() * 0.04, 0.95);
								const newAgreeableness = Math.min(prev.agreeableness + Math.random() * 0.04, 0.95);
								const newNeuroticism = Math.min(prev.neuroticism + Math.random() * 0.04, 0.95);

								return {
									openness: newOpenness,
									conscientiousness: newConscientiousness,
									extraversion: newExtraversion,
									agreeableness: newAgreeableness,
									neuroticism: newNeuroticism,
									opennessPrecision: Math.round(newOpenness * 100),
									conscientiousnessPrecision: Math.round(newConscientiousness * 100),
									extraversionPrecision: Math.round(newExtraversion * 100),
									agreeablenessPrecision: Math.round(newAgreeableness * 100),
									neuroticismPrecision: Math.round(newNeuroticism * 100),
								};
							});

							setIsLoading(false);
						},
					},
				);
			} catch (error) {
				console.error("Failed to send message:", error);
				setIsLoading(false);
			}
		},
		[sessionId, sendMessageRpc],
	);

	return {
		messages,
		traits,
		isLoading: isLoading || isRpcPending,
		isCompleted: false,
		sendMessage,
	};
}
