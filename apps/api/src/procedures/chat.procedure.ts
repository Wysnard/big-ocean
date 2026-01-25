import { v4 as uuidv4 } from "uuid";
import { os } from "../os.js";
import { conductPersonalityAssessment } from "../llm/therapist.js";

// Mock in-memory storage
const sessions = new Map<
  string,
  {
    id: string;
    userId?: string;
    createdAt: string;
    updatedAt: string;
    completed: boolean;
    traits?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
      opennessPrecision?: number;
      conscientiousnessPrecision?: number;
      extraversionPrecision?: number;
      agreeablenessPrecision?: number;
      neuroticismPrecision?: number;
    };
  }
>();

// Therapist session storage
const therapistSessions = new Map<
  string,
  {
    id: string;
    userId?: string;
    createdAt: string;
    updatedAt: string;
    completed: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agentState?: any;
    traits?: {
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
    };
  }
>();

const messages = new Map<
  string,
  Array<{
    id: string;
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>
>();

export const createSession = os.chat.createSession.handler(
  async ({ input }) => {
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    const session = {
      id: sessionId,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
      completed: false,
    };

    sessions.set(sessionId, session);
    messages.set(sessionId, []);

    return session;
  },
);

export const sendMessage = os.chat.sendMessage.handler(async ({ input }) => {
  const { sessionId, message } = input;

  // Check if session exists
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const messageId = uuidv4();
  const now = new Date().toISOString();

  // Store user message
  const userMessage = {
    id: messageId,
    sessionId,
    role: "user" as const,
    content: message,
    createdAt: now,
  };

  const sessionMessages = messages.get(sessionId) || [];
  sessionMessages.push(userMessage);
  messages.set(sessionId, sessionMessages);

  // Update session timestamp
  session.updatedAt = now;
  sessions.set(sessionId, session);

  return userMessage;
});

export const getMessages = os.chat.getMessages.handler(async ({ input }) => {
  const { sessionId, limit } = input;

  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const sessionMessages = messages.get(sessionId) || [];
  return sessionMessages.slice(-limit);
});

export const getSession = os.chat.getSession.handler(async ({ input }) => {
  const { sessionId } = input;
  const session = sessions.get(sessionId);
  return session || null;
});

export const startTherapistAssessment =
  os.chat.startTherapistAssessment.handler(
    async ({ input, context }: { input: { userId?: string }; context: any }) => {
      const logger = context?.logger;

      logger?.info(`[Procedure] startTherapistAssessment called`, { userId: input?.userId });

      const sessionId = uuidv4();
      const now = new Date().toISOString();

      // Initialize therapist session with empty state
      const session = {
        id: sessionId,
        userId: input.userId,
        createdAt: now,
        updatedAt: now,
        completed: false,
        agentState: {
          messages: [],
          assessmentComplete: false,
          evaluateNow: false,
          lastEvaluatedAt: 0,

          // Precision scores
          opennessPrecision: 0,
          conscientiousnessPrecision: 0,
          extraversionPrecision: 0,
          agreeablenessPrecision: 0,
          neuroticismPrecision: 0,

          // All 30 facets initialized to 0
          fantasy: 0,
          aesthetics: 0,
          feelings: 0,
          actions: 0,
          ideas: 0,
          values: 0,
          competence: 0,
          order: 0,
          dutifulness: 0,
          achievementStriving: 0,
          selfDiscipline: 0,
          deliberation: 0,
          warmth: 0,
          gregariousness: 0,
          assertiveness: 0,
          activity: 0,
          excitementSeeking: 0,
          positiveEmotions: 0,
          trust: 0,
          straightforwardness: 0,
          altruism: 0,
          compliance: 0,
          modesty: 0,
          tenderMindedness: 0,
          anxiety: 0,
          angryHostility: 0,
          depression: 0,
          selfConsciousness: 0,
          impulsiveness: 0,
          vulnerability: 0,
        },
      };

      therapistSessions.set(sessionId, session);

      logger?.debug(`[Procedure] Therapist session created`, { sessionId, userId: input?.userId });

      return session;
    },
  );

export const sendTherapistMessage = os.chat.sendTherapistMessage.handler(
  async function* (
    { input, context }: { input: { sessionId: string; message?: string; evaluateNow?: boolean }; context: any },
  ) {
    const { sessionId, message, evaluateNow } = input;
    const logger = context?.logger;

    logger?.info(`[Procedure] sendTherapistMessage called`, {
      sessionId,
      hasMessage: !!message,
      messageLength: message?.length,
      evaluateNow,
    });

    // Get the therapist session
    const session = therapistSessions.get(sessionId);
    if (!session) {
      logger?.warn(`[Procedure] Therapist session not found`, { sessionId });
      throw new Error("Therapist session not found");
    }

    // Pass evaluateNow flag to agent state if provided
    const stateWithEvaluateFlag = {
      ...session.agentState,
      evaluateNow: evaluateNow ?? false,
    };

    // Run the therapist agent with previous state
    const result = await conductPersonalityAssessment(message, stateWithEvaluateFlag);

    // Extract the last AI message
    const lastMessage = result.messages[result.messages.length - 1];
    const responseText =
      lastMessage && lastMessage.type === "ai" ? lastMessage.text : "";

    // Yield response chunks
    if (responseText) {
      yield {
        type: "response" as const,
        chunk: responseText,
      };
    }

    // Calculate main traits from facets (sum of 6 facets each, 0-120 range)
    const openness =
      result.fantasy +
      result.aesthetics +
      result.feelings +
      result.actions +
      result.ideas +
      result.values;
    const conscientiousness =
      result.competence +
      result.order +
      result.dutifulness +
      result.achievementStriving +
      result.selfDiscipline +
      result.deliberation;
    const extraversion =
      result.warmth +
      result.gregariousness +
      result.assertiveness +
      result.activity +
      result.excitementSeeking +
      result.positiveEmotions;
    const agreeableness =
      result.trust +
      result.straightforwardness +
      result.altruism +
      result.compliance +
      result.modesty +
      result.tenderMindedness;
    const neuroticism =
      result.anxiety +
      result.angryHostility +
      result.depression +
      result.selfConsciousness +
      result.impulsiveness +
      result.vulnerability;

    // Update session with new state
    session.agentState = result;
    session.updatedAt = new Date().toISOString();

    therapistSessions.set(sessionId, session);
    logger?.debug(`[Procedure] sendTherapistMessage session updated`, {
      sessionId,
      mainTraits: { openness, conscientiousness, extraversion, agreeableness, neuroticism },
    });

    // Yield traits update with all facets
    yield {
      type: "traits" as const,
      traits: {
        // Main traits (calculated from facets, 0-120)
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,

        // Precision scores (0-1)
        opennessPrecision: result.opennessPrecision,
        conscientiousnessPrecision: result.conscientiousnessPrecision,
        extraversionPrecision: result.extraversionPrecision,
        agreeablenessPrecision: result.agreeablenessPrecision,
        neuroticismPrecision: result.neuroticismPrecision,

        // All 30 facets (0-20 each)
        facets: {
          // Openness facets
          fantasy: result.fantasy,
          aesthetics: result.aesthetics,
          feelings: result.feelings,
          actions: result.actions,
          ideas: result.ideas,
          values: result.values,

          // Conscientiousness facets
          competence: result.competence,
          order: result.order,
          dutifulness: result.dutifulness,
          achievementStriving: result.achievementStriving,
          selfDiscipline: result.selfDiscipline,
          deliberation: result.deliberation,

          // Extraversion facets
          warmth: result.warmth,
          gregariousness: result.gregariousness,
          assertiveness: result.assertiveness,
          activity: result.activity,
          excitementSeeking: result.excitementSeeking,
          positiveEmotions: result.positiveEmotions,

          // Agreeableness facets
          trust: result.trust,
          straightforwardness: result.straightforwardness,
          altruism: result.altruism,
          compliance: result.compliance,
          modesty: result.modesty,
          tenderMindedness: result.tenderMindedness,

          // Neuroticism facets
          anxiety: result.anxiety,
          angryHostility: result.angryHostility,
          depression: result.depression,
          selfConsciousness: result.selfConsciousness,
          impulsiveness: result.impulsiveness,
          vulnerability: result.vulnerability,
        },
      },
      completed: false,
    };
  },
);

export const getTherapistResults = os.chat.getTherapistResults.handler(
  async ({ input }: { input: { sessionId: string } }) => {
    const session = therapistSessions.get(input.sessionId);
    if (!session) {
      throw new Error("Therapist session not found");
    }

    // Calculate main traits from facets in agent state
    const state = session.agentState;
    if (!state) {
      return {
        traits: undefined,
        completed: session.completed,
      };
    }

    const openness =
      state.fantasy +
      state.aesthetics +
      state.feelings +
      state.actions +
      state.ideas +
      state.values;
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

    return {
      traits: {
        // Main traits (calculated from facets, 0-120)
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,

        // Precision scores (0-1)
        opennessPrecision: state.opennessPrecision,
        conscientiousnessPrecision: state.conscientiousnessPrecision,
        extraversionPrecision: state.extraversionPrecision,
        agreeablenessPrecision: state.agreeablenessPrecision,
        neuroticismPrecision: state.neuroticismPrecision,

        // All 30 facets (0-20 each)
        facets: {
          // Openness facets
          fantasy: state.fantasy,
          aesthetics: state.aesthetics,
          feelings: state.feelings,
          actions: state.actions,
          ideas: state.ideas,
          values: state.values,

          // Conscientiousness facets
          competence: state.competence,
          order: state.order,
          dutifulness: state.dutifulness,
          achievementStriving: state.achievementStriving,
          selfDiscipline: state.selfDiscipline,
          deliberation: state.deliberation,

          // Extraversion facets
          warmth: state.warmth,
          gregariousness: state.gregariousness,
          assertiveness: state.assertiveness,
          activity: state.activity,
          excitementSeeking: state.excitementSeeking,
          positiveEmotions: state.positiveEmotions,

          // Agreeableness facets
          trust: state.trust,
          straightforwardness: state.straightforwardness,
          altruism: state.altruism,
          compliance: state.compliance,
          modesty: state.modesty,
          tenderMindedness: state.tenderMindedness,

          // Neuroticism facets
          anxiety: state.anxiety,
          angryHostility: state.angryHostility,
          depression: state.depression,
          selfConsciousness: state.selfConsciousness,
          impulsiveness: state.impulsiveness,
          vulnerability: state.vulnerability,
        },
      },
      completed: session.completed,
    };
  },
);

export const chatRouter = {
  createSession,
  sendMessage,
  getMessages,
  getSession,
  startTherapistAssessment,
  sendTherapistMessage,
  getTherapistResults,
};
