import { ChatAnthropic } from "@langchain/anthropic";
import * as z from "zod";
import "dotenv/config";

if (!process.env.ANTHROPIC_API_KEY) {
	console.warn("[Therapist] ANTHROPIC_API_KEY not set in environment");
}

// LLM 1: Conversational Therapist (focused on empathetic dialogue)
const conversationalModel = new ChatAnthropic({
	model: "claude-sonnet-4-5",
	temperature: 1, // Higher temperature for more natural conversation
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// LLM 2: Personality Evaluator (focused on scoring)
const evaluatorModel = new ChatAnthropic({
	model: "claude-sonnet-4-5",
	temperature: 0.3, // Lower temperature for more consistent scoring
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define structured output schema for Evaluator LLM (assessment only, no response text)
const AssessmentSchema = z.object({
	// Precision/confidence scores for main traits (0-1)
	opennessPrecision: z.number().min(0).max(1).describe("Confidence in openness assessment"),
	conscientiousnessPrecision: z
		.number()
		.min(0)
		.max(1)
		.describe("Confidence in conscientiousness assessment"),
	extraversionPrecision: z.number().min(0).max(1).describe("Confidence in extraversion assessment"),
	agreeablenessPrecision: z
		.number()
		.min(0)
		.max(1)
		.describe("Confidence in agreeableness assessment"),
	neuroticismPrecision: z.number().min(0).max(1).describe("Confidence in neuroticism assessment"),

	// Openness facets (0-20 each)
	fantasy: z.number().min(0).max(20).describe("Fantasy/Imagination facet"),
	aesthetics: z.number().min(0).max(20).describe("Aesthetics facet"),
	feelings: z.number().min(0).max(20).describe("Feelings facet"),
	actions: z.number().min(0).max(20).describe("Actions/Variety facet"),
	ideas: z.number().min(0).max(20).describe("Ideas/Curiosity facet"),
	values: z.number().min(0).max(20).describe("Values facet"),

	// Conscientiousness facets (0-20 each)
	competence: z.number().min(0).max(20).describe("Competence facet"),
	order: z.number().min(0).max(20).describe("Order facet"),
	dutifulness: z.number().min(0).max(20).describe("Dutifulness facet"),
	achievementStriving: z.number().min(0).max(20).describe("Achievement striving facet"),
	selfDiscipline: z.number().min(0).max(20).describe("Self-discipline facet"),
	deliberation: z.number().min(0).max(20).describe("Deliberation facet"),

	// Extraversion facets (0-20 each)
	warmth: z.number().min(0).max(20).describe("Warmth facet"),
	gregariousness: z.number().min(0).max(20).describe("Gregariousness facet"),
	assertiveness: z.number().min(0).max(20).describe("Assertiveness facet"),
	activity: z.number().min(0).max(20).describe("Activity facet"),
	excitementSeeking: z.number().min(0).max(20).describe("Excitement-seeking facet"),
	positiveEmotions: z.number().min(0).max(20).describe("Positive emotions facet"),

	// Agreeableness facets (0-20 each)
	trust: z.number().min(0).max(20).describe("Trust facet"),
	straightforwardness: z.number().min(0).max(20).describe("Straightforwardness facet"),
	altruism: z.number().min(0).max(20).describe("Altruism facet"),
	compliance: z.number().min(0).max(20).describe("Compliance facet"),
	modesty: z.number().min(0).max(20).describe("Modesty facet"),
	tenderMindedness: z.number().min(0).max(20).describe("Tender-mindedness facet"),

	// Neuroticism facets (0-20 each)
	anxiety: z.number().min(0).max(20).describe("Anxiety facet"),
	angryHostility: z.number().min(0).max(20).describe("Angry hostility facet"),
	depression: z.number().min(0).max(20).describe("Depression facet"),
	selfConsciousness: z.number().min(0).max(20).describe("Self-consciousness facet"),
	impulsiveness: z.number().min(0).max(20).describe("Impulsiveness facet"),
	vulnerability: z.number().min(0).max(20).describe("Vulnerability facet"),
});

// Bind evaluator model with structured output
const evaluatorWithStructuredOutput = evaluatorModel.withStructuredOutput(AssessmentSchema, {
	name: "personality_assessment",
});

// Define state using LangGraph
import type { BaseMessage } from "@langchain/core/messages";
import { Annotation, END, type GraphNode, START, StateGraph } from "@langchain/langgraph";

const TherapistStateAnnotation = Annotation.Root({
	messages: Annotation<BaseMessage[]>({
		reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
		default: () => [],
	}),
	assessmentComplete: Annotation<boolean>({
		reducer: (_, next) => next ?? false,
		default: () => false,
	}),
	evaluateNow: Annotation<boolean>({
		reducer: (_, next) => next ?? false,
		default: () => false,
	}),
	lastEvaluatedAt: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),

	// Precision scores for main traits
	opennessPrecision: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	conscientiousnessPrecision: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	extraversionPrecision: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	agreeablenessPrecision: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	neuroticismPrecision: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),

	// Openness facets
	fantasy: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	aesthetics: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	feelings: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	actions: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	ideas: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	values: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),

	// Conscientiousness facets
	competence: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	order: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	dutifulness: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	achievementStriving: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	selfDiscipline: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	deliberation: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),

	// Extraversion facets
	warmth: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	gregariousness: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	assertiveness: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	activity: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	excitementSeeking: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	positiveEmotions: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),

	// Agreeableness facets
	trust: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	straightforwardness: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	altruism: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	compliance: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	modesty: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	tenderMindedness: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),

	// Neuroticism facets
	anxiety: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	angryHostility: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	depression: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	selfConsciousness: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	impulsiveness: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
	vulnerability: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),
});

// Import message types
import { SystemMessage } from "@langchain/core/messages";

// Conversational Node - LLM 1: Generates empathetic therapist response
const conversationNode: GraphNode<typeof TherapistStateAnnotation.State> = async (state) => {
	const systemPrompt = `You are an empathetic personality therapist conducting a Big Five personality assessment interview.

Your ONLY job is to have a warm, natural conversation with the person. DO NOT worry about scoring or calculating personality traits - another system handles that automatically.

**Your Focus:**
- Ask thoughtful, open-ended questions about behaviors, preferences, and reactions
- Listen actively and respond empathetically
- Build rapport and make the person feel comfortable sharing
- Explore different life situations (work, relationships, hobbies, stress, etc.)
- Follow up on interesting points they mention

**Conversation Areas to Explore:**
- How they handle creativity, new experiences, art, ideas (Openness)
- Their approach to organization, goals, discipline (Conscientiousness)
- Social preferences, energy levels, assertiveness (Extraversion)
- How they interact with others, conflict, empathy (Agreeableness)
- Emotional patterns, stress responses, mood (Neuroticism)

Be warm, non-judgmental, and conversational. Let the dialogue flow naturally.`;

	console.debug("[Therapist] Conversational LLM generating response");

	const response = await conversationalModel.invoke([
		new SystemMessage(systemPrompt),
		...state.messages,
	]);

	return {
		messages: [response],
	};
};

// Evaluation Node - LLM 2: Analyzes conversation and provides scores
const evaluationNode: GraphNode<typeof TherapistStateAnnotation.State> = async (state) => {
	const currentPrecisions = {
		openness: state.opennessPrecision,
		conscientiousness: state.conscientiousnessPrecision,
		extraversion: state.extraversionPrecision,
		agreeableness: state.agreeablenessPrecision,
		neuroticism: state.neuroticismPrecision,
	};

	// Calculate current main trait scores from facets
	const openness =
		state.fantasy + state.aesthetics + state.feelings + state.actions + state.ideas + state.values;
	const conscientiousness =
		state.competence +
		state.order +
		state.dutifulness +
		state.achievementStriving +
		state.selfDiscipline +
		state.deliberation;
	const extraversion =
		state.warmth +
		state.gregariousness +
		state.assertiveness +
		state.activity +
		state.excitementSeeking +
		state.positiveEmotions;
	const agreeableness =
		state.trust +
		state.straightforwardness +
		state.altruism +
		state.compliance +
		state.modesty +
		state.tenderMindedness;
	const neuroticism =
		state.anxiety +
		state.angryHostility +
		state.depression +
		state.selfConsciousness +
		state.impulsiveness +
		state.vulnerability;

	const systemPrompt = `You are a personality assessment expert analyzing a therapy conversation to score Big Five personality traits.

**Your Task:**
Analyze the conversation history and provide updated scores for all 30 facets and confidence levels for the 5 main traits.

**Scoring System:**
- Each facet: 0-20 (20 = extremely high on this facet)
- Main trait confidence: 0-1 (1 = completely certain of the assessment)

**The 30 Facets:**

1. **Openness** (Fantasy, Aesthetics, Feelings, Actions, Ideas, Values)
2. **Conscientiousness** (Competence, Order, Dutifulness, Achievement Striving, Self-Discipline, Deliberation)
3. **Extraversion** (Warmth, Gregariousness, Assertiveness, Activity, Excitement-Seeking, Positive Emotions)
4. **Agreeableness** (Trust, Straightforwardness, Altruism, Compliance, Modesty, Tender-Mindedness)
5. **Neuroticism** (Anxiety, Angry Hostility, Depression, Self-Consciousness, Impulsiveness, Vulnerability)

**Current Assessment State:**

1. **Openness to Experience** (${openness}/120) - Confidence: ${(currentPrecisions.openness * 100).toFixed(0)}%
   - Fantasy: ${state.fantasy}/20
   - Aesthetics: ${state.aesthetics}/20
   - Feelings: ${state.feelings}/20
   - Actions: ${state.actions}/20
   - Ideas: ${state.ideas}/20
   - Values: ${state.values}/20

2. **Conscientiousness** (${conscientiousness}/120) - Confidence: ${(currentPrecisions.conscientiousness * 100).toFixed(0)}%
   - Competence: ${state.competence}/20
   - Order: ${state.order}/20
   - Dutifulness: ${state.dutifulness}/20
   - Achievement Striving: ${state.achievementStriving}/20
   - Self-Discipline: ${state.selfDiscipline}/20
   - Deliberation: ${state.deliberation}/20

3. **Extraversion** (${extraversion}/120) - Confidence: ${(currentPrecisions.extraversion * 100).toFixed(0)}%
   - Warmth: ${state.warmth}/20
   - Gregariousness: ${state.gregariousness}/20
   - Assertiveness: ${state.assertiveness}/20
   - Activity: ${state.activity}/20
   - Excitement-Seeking: ${state.excitementSeeking}/20
   - Positive Emotions: ${state.positiveEmotions}/20

4. **Agreeableness** (${agreeableness}/120) - Confidence: ${(currentPrecisions.agreeableness * 100).toFixed(0)}%
   - Trust: ${state.trust}/20
   - Straightforwardness: ${state.straightforwardness}/20
   - Altruism: ${state.altruism}/20
   - Compliance: ${state.compliance}/20
   - Modesty: ${state.modesty}/20
   - Tender-Mindedness: ${state.tenderMindedness}/20

5. **Neuroticism** (${neuroticism}/120) - Confidence: ${(currentPrecisions.neuroticism * 100).toFixed(0)}%
   - Anxiety: ${state.anxiety}/20
   - Angry Hostility: ${state.angryHostility}/20
   - Depression: ${state.depression}/20
   - Self-Consciousness: ${state.selfConsciousness}/20
   - Impulsiveness: ${state.impulsiveness}/20
   - Vulnerability: ${state.vulnerability}/20

**Instructions:**
1. Review the entire conversation history
2. Look for behavioral indicators, preferences, and self-descriptions
3. Update facet scores based on evidence from the conversation
4. Update confidence levels based on how much information you have
5. If you haven't learned about a facet yet, keep score low and confidence low
6. Be objective and evidence-based in your scoring

Return updated scores for ALL 30 facets and 5 confidence levels.`;

	console.debug("[Therapist] Evaluator LLM analyzing conversation");

	try {
		const assessment = await evaluatorWithStructuredOutput.invoke([
			new SystemMessage(systemPrompt),
			...state.messages,
		]);

		const messageCount = state.messages.filter((m: BaseMessage) => m.type === "human").length;

		console.info("[Therapist] Evaluation completed", {
			messageCount,
			opennessPrecision: assessment.opennessPrecision,
			conscientiousnessPrecision: assessment.conscientiousnessPrecision,
		});

		return {
			// Update all 30 facet scores
			fantasy: assessment.fantasy,
			aesthetics: assessment.aesthetics,
			feelings: assessment.feelings,
			actions: assessment.actions,
			ideas: assessment.ideas,
			values: assessment.values,
			competence: assessment.competence,
			order: assessment.order,
			dutifulness: assessment.dutifulness,
			achievementStriving: assessment.achievementStriving,
			selfDiscipline: assessment.selfDiscipline,
			deliberation: assessment.deliberation,
			warmth: assessment.warmth,
			gregariousness: assessment.gregariousness,
			assertiveness: assessment.assertiveness,
			activity: assessment.activity,
			excitementSeeking: assessment.excitementSeeking,
			positiveEmotions: assessment.positiveEmotions,
			trust: assessment.trust,
			straightforwardness: assessment.straightforwardness,
			altruism: assessment.altruism,
			compliance: assessment.compliance,
			modesty: assessment.modesty,
			tenderMindedness: assessment.tenderMindedness,
			anxiety: assessment.anxiety,
			angryHostility: assessment.angryHostility,
			depression: assessment.depression,
			selfConsciousness: assessment.selfConsciousness,
			impulsiveness: assessment.impulsiveness,
			vulnerability: assessment.vulnerability,

			// Update 5 precision scores
			opennessPrecision: assessment.opennessPrecision,
			conscientiousnessPrecision: assessment.conscientiousnessPrecision,
			extraversionPrecision: assessment.extraversionPrecision,
			agreeablenessPrecision: assessment.agreeablenessPrecision,
			neuroticismPrecision: assessment.neuroticismPrecision,

			// Track when evaluation occurred
			lastEvaluatedAt: messageCount,
			evaluateNow: false, // Reset the flag
		};
	} catch (error) {
		console.error("[Therapist] Evaluation failed", {
			error: error instanceof Error ? error.message : String(error),
		});
		// On error, return previous state (no updates)
		return {
			evaluateNow: false, // Reset the flag even on error
		};
	}
};

// Conditional function to determine if we should evaluate
const shouldEvaluate = (state: typeof TherapistStateAnnotation.State) => {
	const messageCount = state.messages.filter((m: BaseMessage) => m.type === "human").length;
	const evaluationInterval = 3; // Evaluate every 3 messages
	const shouldEvaluateNow = state.evaluateNow ?? false;

	// Evaluate if:
	// 1. First message (messageCount === 1)
	// 2. Every N messages
	// 3. On demand (evaluateNow flag set)
	if (messageCount === 1 || messageCount % evaluationInterval === 0 || shouldEvaluateNow) {
		console.debug("[Therapist] Triggering evaluation", {
			messageCount,
			reason: messageCount === 1 ? "first message" : shouldEvaluateNow ? "on demand" : "periodic",
		});
		return "evaluate";
	}

	console.debug("[Therapist] Skipping evaluation", { messageCount });
	return "skip";
};

// Build the agent graph
import { HumanMessage } from "@langchain/core/messages";

// biome-ignore lint: StateGraph typing requires any for dynamic graph construction
const agent: any = new StateGraph(TherapistStateAnnotation)
	.addNode("conversationNode", conversationNode)
	.addNode("evaluationNode", evaluationNode)
	.addEdge(START, "conversationNode")
	.addConditionalEdges("conversationNode", shouldEvaluate, {
		evaluate: "evaluationNode",
		skip: END,
	})
	.addEdge("evaluationNode", END)
	.compile();

type AgentOutput = Awaited<ReturnType<typeof agent.invoke>>;

// Example usage do not use this function except for testing
export async function conductPersonalityAssessment(
	userInput?: string,
	previousState?: Partial<AgentOutput>,
): Promise<AgentOutput> {
	try {
		console.info("[Therapist] Starting personality assessment", {
			hasUserInput: !!userInput,
			inputLength: userInput?.length,
			hasPreviousState: !!previousState,
		});

		// Start with previous state or initialize
		const messages = previousState?.messages || [];
		if (userInput) {
			messages.push(new HumanMessage(userInput));
		}

		console.debug("[Therapist] Invoking agent", {
			messageCount: messages.length,
			previousPrecisions: previousState
				? {
						openness: previousState.opennessPrecision,
						conscientiousness: previousState.conscientiousnessPrecision,
						extraversion: previousState.extraversionPrecision,
						agreeableness: previousState.agreeablenessPrecision,
						neuroticism: previousState.neuroticismPrecision,
					}
				: "none",
		});

		const result = await agent.invoke({
			messages,
			assessmentComplete: previousState?.assessmentComplete ?? false,
			evaluateNow: previousState?.evaluateNow ?? false,
			lastEvaluatedAt: previousState?.lastEvaluatedAt ?? 0,

			// Precision scores
			opennessPrecision: previousState?.opennessPrecision ?? 0,
			conscientiousnessPrecision: previousState?.conscientiousnessPrecision ?? 0,
			extraversionPrecision: previousState?.extraversionPrecision ?? 0,
			agreeablenessPrecision: previousState?.agreeablenessPrecision ?? 0,
			neuroticismPrecision: previousState?.neuroticismPrecision ?? 0,

			// Openness facets
			fantasy: previousState?.fantasy ?? 0,
			aesthetics: previousState?.aesthetics ?? 0,
			feelings: previousState?.feelings ?? 0,
			actions: previousState?.actions ?? 0,
			ideas: previousState?.ideas ?? 0,
			values: previousState?.values ?? 0,

			// Conscientiousness facets
			competence: previousState?.competence ?? 0,
			order: previousState?.order ?? 0,
			dutifulness: previousState?.dutifulness ?? 0,
			achievementStriving: previousState?.achievementStriving ?? 0,
			selfDiscipline: previousState?.selfDiscipline ?? 0,
			deliberation: previousState?.deliberation ?? 0,

			// Extraversion facets
			warmth: previousState?.warmth ?? 0,
			gregariousness: previousState?.gregariousness ?? 0,
			assertiveness: previousState?.assertiveness ?? 0,
			activity: previousState?.activity ?? 0,
			excitementSeeking: previousState?.excitementSeeking ?? 0,
			positiveEmotions: previousState?.positiveEmotions ?? 0,

			// Agreeableness facets
			trust: previousState?.trust ?? 0,
			straightforwardness: previousState?.straightforwardness ?? 0,
			altruism: previousState?.altruism ?? 0,
			compliance: previousState?.compliance ?? 0,
			modesty: previousState?.modesty ?? 0,
			tenderMindedness: previousState?.tenderMindedness ?? 0,

			// Neuroticism facets
			anxiety: previousState?.anxiety ?? 0,
			angryHostility: previousState?.angryHostility ?? 0,
			depression: previousState?.depression ?? 0,
			selfConsciousness: previousState?.selfConsciousness ?? 0,
			impulsiveness: previousState?.impulsiveness ?? 0,
			vulnerability: previousState?.vulnerability ?? 0,
		});

		console.debug("[Therapist] Assessment completed", {
			messageCount: result.messages?.length || 0,
			opennessPrecision: result.opennessPrecision,
			conscientiousnessPrecision: result.conscientiousnessPrecision,
			extraversionPrecision: result.extraversionPrecision,
			agreeablenessPrecision: result.agreeablenessPrecision,
			neuroticismPrecision: result.neuroticismPrecision,
		});

		return result;
	} catch (error) {
		console.error("[Therapist] Assessment failed", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	}
}

// Export the therapist agent
export { agent as therapistAgent };
