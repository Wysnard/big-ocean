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

import {
	NerinAgentRepository,
	type NerinInvokeInput,
	type NerinInvokeOutput,
	type TokenUsage,
} from "@workspace/domain/repositories/nerin-agent.repository";
import { Effect, Layer } from "effect";

/**
 * Mock response structure
 */
interface MockResponse {
	readonly text: string;
	readonly reasoning: string;
}

/**
 * Pattern-based response generator
 *
 * Provides contextually relevant responses based on message content.
 * Each pattern maps to a Big Five personality trait for testing purposes.
 */
function generateMockResponse(message: string): MockResponse {
	// Normalize message for pattern matching
	const lowerMessage = message.toLowerCase();

	// Pattern 1: Conscientiousness signals (organization, planning, structure)
	if (/organiz|plan|schedule|structur|list|order|detail|methodic|system/i.test(lowerMessage)) {
		return {
			text:
				"I appreciate your structured approach to things! It sounds like you value having a plan. How do you typically organize your day or week? Do you prefer detailed schedules or more flexible outlines?",
			reasoning: "High conscientiousness signal detected - exploring planning behaviors",
		};
	}

	// Pattern 2: Openness signals (creativity, imagination, new ideas)
	if (/creat|imagin|idea|art|novel|curio|explore|innovat|dream|philosoph/i.test(lowerMessage)) {
		return {
			text:
				"That's a creative perspective! I love how you think about things differently. What sparks your imagination the most? Are there particular topics or activities that make you feel most creative?",
			reasoning: "High openness signal detected - exploring creative tendencies",
		};
	}

	// Pattern 3: Extraversion signals (social, people, party, group)
	if (/social|people|party|group|friend|gather|talk|meet|crowd|energi/i.test(lowerMessage)) {
		return {
			text:
				"It sounds like you enjoy being around others! Social connections can be really energizing. Do you find yourself seeking out group activities, or do you prefer smaller gatherings?",
			reasoning: "High extraversion signal detected - exploring social preferences",
		};
	}

	// Pattern 4: Agreeableness signals (help, care, kind, support)
	if (
		/help|care|kind|support|compassion|cooperat|team|empath|understand|listen/i.test(lowerMessage)
	) {
		return {
			text:
				"That's very thoughtful of you. It's clear that caring for others is important to you. How do you balance taking care of others with taking care of yourself?",
			reasoning: "High agreeableness signal detected - exploring prosocial tendencies",
		};
	}

	// Pattern 5: Neuroticism signals (worry, stress, anxiety, nervous)
	if (/worry|stress|anxiety|nervous|overwhelm|fear|tense|upset|calm|relax/i.test(lowerMessage)) {
		return {
			text:
				"I hear that you're thinking about how you handle stress. That kind of self-awareness is valuable. What strategies have you found helpful when you're feeling overwhelmed?",
			reasoning: "Emotional stability exploration - non-judgmental inquiry",
		};
	}

	// Pattern 6: Work/career context
	if (/work|job|career|office|colleague|boss|project|deadline|meeting/i.test(lowerMessage)) {
		return {
			text:
				"Work life can reveal a lot about how we approach challenges. What aspects of your work do you find most fulfilling? And what parts do you find most challenging?",
			reasoning: "Work context - exploring conscientiousness and stress responses",
		};
	}

	// Pattern 7: Relationship/connection context
	if (/relationship|family|partner|parent|sibling|love|trust|connect/i.test(lowerMessage)) {
		return {
			text:
				"Relationships shape so much of who we are. How would you describe your approach to building trust with people? Do you tend to open up quickly or take your time?",
			reasoning: "Relationship context - exploring attachment and agreeableness",
		};
	}

	// Pattern 8: Conflict/disagreement context
	if (/disagree|conflict|argue|debate|opinion|different|oppose|frustrat/i.test(lowerMessage)) {
		return {
			text:
				"Navigating differences can be tricky. When you find yourself in a disagreement, how do you usually approach it? Do you prefer to address it directly or find common ground first?",
			reasoning: "Conflict context - exploring agreeableness and communication style",
		};
	}

	// Pattern 9: Change/uncertainty context
	if (/change|new|different|uncertain|future|risk|adapt|unexpected/i.test(lowerMessage)) {
		return {
			text:
				"Change can be both exciting and challenging. How do you typically feel when faced with unexpected changes? Do you tend to see them as opportunities or obstacles?",
			reasoning: "Change context - exploring openness and emotional stability",
		};
	}

	// Pattern 10: Greeting/start of conversation
	if (/hello|hi|hey|start|begin|nice to meet|good morning|good afternoon/i.test(lowerMessage)) {
		return {
			text:
				"Hello! I'm Nerin, and I'm looking forward to getting to know you better. To start our conversation, I'm curious: what's something you've been thinking about lately?",
			reasoning: "Greeting - warm welcome and open-ended invitation",
		};
	}

	// Default fallback - generic engagement
	return {
		text:
			"That's interesting, thank you for sharing. Could you tell me a bit more about that? I'd love to understand your perspective better.",
		reasoning: "General engagement - no strong trait signal, continuing exploration",
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
			Effect.sync(() => {
				// Get the last user message for pattern matching
				const lastMessage = input.messages.at(-1);
				const messageContent = lastMessage
					? typeof lastMessage.content === "string"
						? lastMessage.content
						: String(lastMessage.content)
					: "";

				// Generate mock response
				const mockResponse = generateMockResponse(messageContent);

				// Generate mock token usage
				const tokenCount = generateMockTokenUsage(messageContent, mockResponse.text);

				console.log(`[MockNerin] Session: ${input.sessionId}`);
				console.log(`[MockNerin] Input: "${messageContent.substring(0, 50)}..."`);
				console.log(`[MockNerin] Response: "${mockResponse.text.substring(0, 50)}..."`);
				console.log(`[MockNerin] Reasoning: ${mockResponse.reasoning}`);

				return {
					response: mockResponse.text,
					tokenCount,
				};
			}),
	}),
);
