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
 * Pattern-based response generator
 *
 * Provides contextually relevant plain-text responses based on message content.
 * Each pattern maps to a Big Five personality trait for testing purposes.
 */
function generateMockResponse(message: string): string {
	const lowerMessage = message.toLowerCase();

	if (/organiz|plan|schedule|structur|list|order|detail|methodic|system/i.test(lowerMessage)) {
		return "I appreciate your structured approach to things! It sounds like you value having a plan. How do you typically organize your day or week? Do you prefer detailed schedules or more flexible outlines?";
	}

	if (/creat|imagin|idea|art|novel|curio|explore|innovat|dream|philosoph/i.test(lowerMessage)) {
		return "That's a creative perspective! I love how you think about things differently. What sparks your imagination the most? Are there particular topics or activities that make you feel most creative?";
	}

	if (/social|people|party|group|friend|gather|talk|meet|crowd|energi/i.test(lowerMessage)) {
		return "It sounds like you enjoy being around others! Social connections can be really energizing. Do you find yourself seeking out group activities, or do you prefer smaller gatherings?";
	}

	if (
		/help|care|kind|support|compassion|cooperat|team|empath|understand|listen/i.test(lowerMessage)
	) {
		return "That's very thoughtful of you. It's clear that caring for others is important to you. How do you balance taking care of others with taking care of yourself?";
	}

	if (/worry|stress|anxiety|nervous|overwhelm|fear|tense|upset|calm|relax/i.test(lowerMessage)) {
		return "I hear that you're thinking about how you handle stress. That kind of self-awareness is valuable. What strategies have you found helpful when you're feeling overwhelmed?";
	}

	if (/work|job|career|office|colleague|boss|project|deadline|meeting/i.test(lowerMessage)) {
		return "Work life can reveal a lot about how we approach challenges. What aspects of your work do you find most fulfilling? And what parts do you find most challenging?";
	}

	if (/relationship|family|partner|parent|sibling|love|trust|connect/i.test(lowerMessage)) {
		return "Relationships shape so much of who we are. How would you describe your approach to building trust with people? Do you tend to open up quickly or take your time?";
	}

	if (/disagree|conflict|argue|debate|opinion|different|oppose|frustrat/i.test(lowerMessage)) {
		return "Navigating differences can be tricky. When you find yourself in a disagreement, how do you usually approach it? Do you prefer to address it directly or find common ground first?";
	}

	if (/change|new|different|uncertain|future|risk|adapt|unexpected/i.test(lowerMessage)) {
		return "Change can be both exciting and challenging. How do you typically feel when faced with unexpected changes? Do you tend to see them as opportunities or obstacles?";
	}

	if (/hello|hi|hey|start|begin|nice to meet|good morning|good afternoon/i.test(lowerMessage)) {
		return "Hello! I'm Nerin, and I'm looking forward to getting to know you better. To start our conversation, I'm curious: what's something you've been thinking about lately?";
	}

	return "That's interesting, thank you for sharing. Could you tell me a bit more about that? I'd love to understand your perspective better.";
}

/**
 * Generate mock token usage statistics
 *
 * Simulates realistic token counts based on message length
 */
function generateMockTokenUsage(inputMessage: string, responseText: string): TokenUsage {
	const inputTokens = Math.ceil(inputMessage.length / 4) + 50;
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
				const lastMessage = input.messages.at(-1);
				const messageContent = lastMessage?.content ?? "";

				const response = generateMockResponse(messageContent);
				const tokenCount = generateMockTokenUsage(messageContent, response);

				// Simulate API latency (500-1500ms)
				const delay = Math.floor(Math.random() * 1000) + 500;
				yield* Effect.sleep(`${delay} millis`);

				return {
					response,
					tokenCount,
				};
			}),
	}),
);
