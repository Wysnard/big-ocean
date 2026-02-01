/**
 * Nerin Agent Repository Implementation
 *
 * LangGraph-based implementation of the Nerin conversational agent.
 * Uses PostgresSaver for state persistence across API calls.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 */

import { Layer, Effect } from "effect";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import {
  NerinAgentRepository,
  type NerinInvokeInput,
  type NerinInvokeOutput,
  type TokenUsage,
  type PrecisionScores,
} from "@workspace/domain/repositories/nerin-agent.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { AgentInvocationError } from "@workspace/contracts/errors";

/**
 * Pricing constants for Claude Sonnet 4.5
 * Per 1 million tokens
 */
const INPUT_PRICE_PER_MILLION = 0.003;
const OUTPUT_PRICE_PER_MILLION = 0.015;

/**
 * Build dynamic system prompt based on precision scores
 */
function buildSystemPrompt(precision?: PrecisionScores): string {
  let prompt = `You are Nerin, a warm and curious conversational partner helping users explore their personality through natural dialogue.

Key behaviors:
- Begin with a warm greeting when starting a new conversation
- Ask open-ended questions that invite genuine sharing
- Maintain a non-judgmental, supportive tone throughout
- Reference earlier parts of the conversation to show you're listening
- Avoid repetitive questions or making it feel forced or clinical
- Keep responses concise but engaging (2-4 sentences typically)`;

  if (precision) {
    // Find lowest precision trait for exploration focus
    const entries = Object.entries(precision).filter(
      ([_, value]) => value !== undefined,
    ) as [string, number][];

    if (entries.length > 0) {
      const lowest = entries.reduce((min, curr) =>
        (curr[1] ?? 100) < (min[1] ?? 100) ? curr : min,
      );

      prompt += `

Current assessment focus:
Trait with lowest confidence: ${lowest[0]} (${lowest[1]}%)
Naturally guide the conversation to explore this area while keeping the dialogue comfortable and authentic.`;
    }
  }

  return prompt;
}

/**
 * Track token usage from API response metadata
 */
function trackTokens(usageMetadata: {
  input_tokens?: number;
  output_tokens?: number;
}): TokenUsage {
  const input = usageMetadata.input_tokens ?? 0;
  const output = usageMetadata.output_tokens ?? 0;
  return {
    input,
    output,
    total: input + output,
  };
}

/**
 * Calculate cost from token usage
 */
function calculateCost(usage: TokenUsage): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
} {
  const inputCost = (usage.input / 1_000_000) * INPUT_PRICE_PER_MILLION;
  const outputCost = (usage.output / 1_000_000) * OUTPUT_PRICE_PER_MILLION;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * State Annotation for LangGraph
 * Uses Annotation.Root for proper TypeScript typing
 */
const NerinStateAnnotation = Annotation.Root({
  sessionId: Annotation<string>,
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
    default: () => [] as BaseMessage[],
  }),
  precision: Annotation<PrecisionScores | undefined>,
  tokenCount: Annotation<TokenUsage | undefined>,
});

type NerinGraphState = typeof NerinStateAnnotation.State;

/**
 * Create the ChatAnthropic model instance
 */
function createModel(): ChatAnthropic {
  return new ChatAnthropic({
    model: process.env.NERIN_MODEL_ID || "claude-sonnet-4-20250514",
    maxTokens: Number(process.env.NERIN_MAX_TOKENS) || 1024,
    temperature: Number(process.env.NERIN_TEMPERATURE) || 0.7,
  });
}

/**
 * Nerin Agent Repository Layer
 *
 * Layer type: Layer<NerinAgentRepository, never, LoggerRepository>
 * Initializes LangGraph and PostgresSaver during layer construction.
 */
export const NerinAgentLangGraphRepositoryLive = Layer.effect(
  NerinAgentRepository,
  Effect.gen(function* () {
    const logger = yield* LoggerRepository;

    // Initialize PostgresSaver if DATABASE_URL is available
    const dbUri = process.env.DATABASE_URL;
    let checkpointer: PostgresSaver | undefined;

    if (dbUri) {
      checkpointer = PostgresSaver.fromConnString(dbUri);
      // Setup checkpointer tables (using Effect.promise for async)
      yield* Effect.tryPromise({
        try: () => checkpointer!.setup(),
        catch: (error) => {
          logger.error("Failed to initialize PostgresSaver", {
            error: error instanceof Error ? error.message : String(error),
          });
          // Return undefined to continue without checkpointer
          return undefined;
        },
      }).pipe(
        Effect.tap(() =>
          Effect.sync(() => logger.info("PostgresSaver checkpointer initialized")),
        ),
        Effect.catchAll(() => Effect.succeed(undefined)),
      );
    } else {
      logger.warn("DATABASE_URL not set - Nerin agent state will not persist");
    }

    // Create the model
    const model = createModel();

    // Build the LangGraph workflow with typed state
    const workflow = new StateGraph(NerinStateAnnotation)
      .addNode("nerin", async (state: NerinGraphState) => {
        // Build system prompt with precision context
        const systemPrompt = buildSystemPrompt(state.precision);

        // Prepare messages with system prompt
        const allMessages = [
          new SystemMessage({ content: systemPrompt }),
          ...state.messages,
        ];

        // Stream response and collect tokens
        let fullContent = "";
        let tokenUsage: TokenUsage = { input: 0, output: 0, total: 0 };

        const stream = await model.stream(allMessages);
        for await (const chunk of stream) {
          fullContent += chunk.content;
          if (chunk.usage_metadata) {
            tokenUsage = trackTokens(chunk.usage_metadata);
          }
        }

        return {
          messages: [new AIMessage({ content: fullContent })],
          tokenCount: tokenUsage,
        };
      })
      .addEdge(START, "nerin")
      .addEdge("nerin", END);

    // Compile the graph with checkpointer
    const graph = workflow.compile({
      checkpointer: checkpointer,
    });

    logger.info("Nerin agent graph compiled successfully");

    // Return service implementation
    return NerinAgentRepository.of({
      invoke: (input: NerinInvokeInput) =>
        Effect.tryPromise({
          try: async () => {
            const result = await graph.invoke(
              {
                sessionId: input.sessionId,
                messages: [...input.messages],
                precision: input.precision,
              },
              {
                configurable: { thread_id: input.sessionId },
              },
            );

            // Extract response from last message
            const lastMessage = result.messages.at(-1);
            const response = lastMessage ? String(lastMessage.content) : "";

            // Get token count with defaults
            const tokenCount: TokenUsage = result.tokenCount ?? {
              input: 0,
              output: 0,
              total: 0,
            };

            // Log cost
            const cost = calculateCost(tokenCount);
            logger.info("Nerin response generated", {
              sessionId: input.sessionId,
              responseLength: response.length,
              tokenCount,
              cost: cost.totalCost,
            });

            return {
              response,
              tokenCount,
            };
          },
          catch: (error) =>
            new AgentInvocationError({
              agentName: "Nerin",
              sessionId: input.sessionId,
              message: error instanceof Error ? error.message : "Unknown agent error",
            }),
        }),
    });
  }),
);
