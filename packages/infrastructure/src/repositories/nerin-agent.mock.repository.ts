/**
 * Nerin Agent Mock Repository
 *
 * Mock implementation for integration testing that provides pattern-based responses
 * without calling the real Anthropic API. Used when MOCK_LLM=true environment variable is set.
 *
 * Benefits:
 * - Zero API costs during integration testing
 * - Deterministic responses for reliable test assertions
 * - Fast execution (no network latency)
 * - Pattern-based responses that mimic real Nerin behavior
 *
 * Reference: Story 2.8 - Docker Setup for Integration Testing
 */

import type { NerinResponse } from "@workspace/domain";
import {
	NerinAgentRepository,
	type NerinInvokeInput,
	type NerinInvokeOutput,
	type TokenUsage,
} from "@workspace/domain/repositories/nerin-agent.repository";
import { Effect, Layer } from "effect";

/**
 * Pattern-based response generator
 *
 * Provides contextually relevant responses based on message content.
 * Each pattern maps to a Big Five personality trait for testing purposes.
 * Returns structured NerinResponse matching production agent format.
 */
function generateMockResponse(message: string): NerinResponse {
	// Normalize message for pattern matching
	const lowerMessage = message.toLowerCase();

	// Pattern 1: Conscientiousness signals (organization, planning, structure)
	if (/organiz|plan|schedule|structur|list|order|detail|methodic|system/i.test(lowerMessage)) {
		return {
			message:
				"I appreciate your structured approach to things! It sounds like you value having a plan. How do you typically organize your day or week? Do you prefer detailed schedules or more flexible outlines?",
			emotionalTone: "curious",
			followUpIntent: true,
			suggestedTopics: ["organization", "planning", "structure", "conscientiousness"],
		};
	}

	// Pattern 2: Openness signals (creativity, imagination, new ideas)
	if (/creat|imagin|idea|art|novel|curio|explore|innovat|dream|philosoph/i.test(lowerMessage)) {
		return {
			message:
				"That's a creative perspective! I love how you think about things differently. What sparks your imagination the most? Are there particular topics or activities that make you feel most creative?",
			emotionalTone: "encouraging",
			followUpIntent: true,
			suggestedTopics: ["creativity", "imagination", "ideas", "openness"],
		};
	}

	// Pattern 3: Extraversion signals (social, people, party, group)
	if (/social|people|party|group|friend|gather|talk|meet|crowd|energi/i.test(lowerMessage)) {
		return {
			message:
				"It sounds like you enjoy being around others! Social connections can be really energizing. Do you find yourself seeking out group activities, or do you prefer smaller gatherings?",
			emotionalTone: "warm",
			followUpIntent: true,
			suggestedTopics: ["social", "friendships", "gatherings", "extraversion"],
		};
	}

	// Pattern 4: Agreeableness signals (help, care, kind, support)
	if (
		/help|care|kind|support|compassion|cooperat|team|empath|understand|listen/i.test(lowerMessage)
	) {
		return {
			message:
				"That's very thoughtful of you. It's clear that caring for others is important to you. How do you balance taking care of others with taking care of yourself?",
			emotionalTone: "warm",
			followUpIntent: true,
			suggestedTopics: ["care", "empathy", "relationships", "agreeableness"],
		};
	}

	// Pattern 5: Neuroticism signals (worry, stress, anxiety, nervous)
	if (/worry|stress|anxiety|nervous|overwhelm|fear|tense|upset|calm|relax/i.test(lowerMessage)) {
		return {
			message:
				"I hear that you're thinking about how you handle stress. That kind of self-awareness is valuable. What strategies have you found helpful when you're feeling overwhelmed?",
			emotionalTone: "supportive",
			followUpIntent: true,
			suggestedTopics: ["stress", "coping", "self-awareness", "emotional-stability"],
		};
	}

	// Pattern 6: Work/career context
	if (/work|job|career|office|colleague|boss|project|deadline|meeting/i.test(lowerMessage)) {
		return {
			message:
				"Work life can reveal a lot about how we approach challenges. What aspects of your work do you find most fulfilling? And what parts do you find most challenging?",
			emotionalTone: "curious",
			followUpIntent: true,
			suggestedTopics: ["work", "challenges", "fulfillment", "conscientiousness"],
		};
	}

	// Pattern 7: Relationship/connection context
	if (/relationship|family|partner|parent|sibling|love|trust|connect/i.test(lowerMessage)) {
		return {
			message:
				"Relationships shape so much of who we are. How would you describe your approach to building trust with people? Do you tend to open up quickly or take your time?",
			emotionalTone: "warm",
			followUpIntent: true,
			suggestedTopics: ["relationships", "trust", "connection", "agreeableness"],
		};
	}

	// Pattern 8: Conflict/disagreement context
	if (/disagree|conflict|argue|debate|opinion|different|oppose|frustrat/i.test(lowerMessage)) {
		return {
			message:
				"Navigating differences can be tricky. When you find yourself in a disagreement, how do you usually approach it? Do you prefer to address it directly or find common ground first?",
			emotionalTone: "supportive",
			followUpIntent: true,
			suggestedTopics: ["conflict", "communication", "disagreement", "agreeableness"],
		};
	}

	// Pattern 9: Change/uncertainty context
	if (/change|new|different|uncertain|future|risk|adapt|unexpected/i.test(lowerMessage)) {
		return {
			message:
				"Change can be both exciting and challenging. How do you typically feel when faced with unexpected changes? Do you tend to see them as opportunities or obstacles?",
			emotionalTone: "curious",
			followUpIntent: true,
			suggestedTopics: ["change", "adaptation", "uncertainty", "openness"],
		};
	}

	// Pattern 10: Greeting/start of conversation
	if (/hello|hi|hey|start|begin|nice to meet|good morning|good afternoon/i.test(lowerMessage)) {
		return {
			message:
				"Hello! I'm Nerin, and I'm looking forward to getting to know you better. To start our conversation, I'm curious: what's something you've been thinking about lately?",
			emotionalTone: "warm",
			followUpIntent: true,
			suggestedTopics: ["introduction", "getting-to-know-you"],
		};
	}

	// Default fallback - generic engagement
	return {
		message:
			"That's interesting, thank you for sharing. Could you tell me a bit more about that? I'd love to understand your perspective better.",
		emotionalTone: "curious",
		followUpIntent: true,
		suggestedTopics: ["general-exploration"],
	};
}

/**
 * Generate mock token usage statistics
 *
 * Simulates realistic token counts based on message length
 */
function generateMockTokenUsage(inputMessage: string, responseText: string): TokenUsage {
	// Rough approximation: ~4 characters per token
	const inputTokens = Math.ceil(inputMessage.length / 4) + 50; // +50 for system prompt
	const outputTokens = Math.ceil(responseText.length / 4);

	return {
		input: inputTokens,
		output: outputTokens,
		total: inputTokens + outputTokens,
	};
}

/**
 * Nerin Agent Mock Repository Layer
 *
 * Provides mock responses for integration testing without calling Anthropic API.
 * Activated when MOCK_LLM=true environment variable is set.
 */
export const NerinAgentMockRepositoryLive = Layer.succeed(
	NerinAgentRepository,
	NerinAgentRepository.of({
		invoke: (input: NerinInvokeInput): Effect.Effect<NerinInvokeOutput, never, never> =>
			Effect.gen(function* () {
				// Get the last user message for pattern matching
				const lastMessage = input.messages.at(-1);
				const messageContent = lastMessage
					? typeof lastMessage.content === "string"
						? lastMessage.content
						: String(lastMessage.content)
					: "";

				// Generate structured mock response
				const mockResponse = generateMockResponse(messageContent);

				// Generate mock token usage
				const tokenCount = generateMockTokenUsage(messageContent, mockResponse.message);

				console.log(`[MockNerin] Session: ${input.sessionId}`);
				console.log(`[MockNerin] Input: "${messageContent.substring(0, 50)}..."`);
				console.log(`[MockNerin] Response: "${mockResponse.message.substring(0, 50)}..."`);
				console.log(`[MockNerin] Tone: ${mockResponse.emotionalTone}`);
				console.log(`[MockNerin] Follow-up: ${mockResponse.followUpIntent}`);
				console.log(`[MockNerin] Topics: ${mockResponse.suggestedTopics.join(", ")}`);
				if (input.steeringHint) {
					console.log(`[MockNerin] Steering: ${input.steeringHint}`);
				}
				if (input.facetScores) {
					console.log(`[MockNerin] Facets assessed: ${Object.keys(input.facetScores).length}`);
				}

				// Add realistic delay to simulate API latency (500-1500ms)
				// This ensures e2e tests can detect the loading state
				const delay = Math.floor(Math.random() * 1000) + 500;
				yield* Effect.sleep(`${delay} millis`);

				return {
					response: mockResponse.message,
					tokenCount,
				};
			}),
	}),
);
