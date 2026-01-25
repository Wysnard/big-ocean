import { oc } from "@orpc/contract";
import { eventIterator } from "@orpc/server";
import { z } from "zod";

export const exampleContract = oc
  .input(
    z.object({
      name: z.string(),
      age: z.number().int().min(0),
    }),
  )
  .output(
    z.object({
      id: z.number().int().min(0),
      name: z.string(),
      age: z.number().int().min(0),
    }),
  );

export const PlanetSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  description: z.string().optional(),
});

export const listPlanetContract = oc
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).optional(),
      cursor: z.number().int().min(0).default(0),
    }),
  )
  .output(z.array(PlanetSchema));

export const findPlanetContract = oc
  .input(PlanetSchema.pick({ id: true }))
  .output(PlanetSchema);

export const createPlanetContract = oc
  .input(PlanetSchema.omit({ id: true }))
  .output(PlanetSchema);

// Chat and Big Five Personality Traits
export const ChatMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.string().datetime(),
});

export const PersonalityTraitsSchema = z.object({
  openness: z.number().min(0).max(100),
  conscientiousness: z.number().min(0).max(100),
  extraversion: z.number().min(0).max(100),
  agreeableness: z.number().min(0).max(100),
  neuroticism: z.number().min(0).max(100),
});

export const PersonalityTraitPrecisionSchema = z.object({
  // Main traits (0-120, sum of 6 facets each)
  openness: z.number().min(0).max(120),
  conscientiousness: z.number().min(0).max(120),
  extraversion: z.number().min(0).max(120),
  agreeableness: z.number().min(0).max(120),
  neuroticism: z.number().min(0).max(120),

  // Precision scores (0-1)
  opennessPrecision: z.number().min(0).max(1),
  conscientiousnessPrecision: z.number().min(0).max(1),
  extraversionPrecision: z.number().min(0).max(1),
  agreeablenessPrecision: z.number().min(0).max(1),
  neuroticismPrecision: z.number().min(0).max(1),

  // All 30 facets (0-20 each)
  facets: z.object({
    // Openness facets
    fantasy: z.number().min(0).max(20),
    aesthetics: z.number().min(0).max(20),
    feelings: z.number().min(0).max(20),
    actions: z.number().min(0).max(20),
    ideas: z.number().min(0).max(20),
    values: z.number().min(0).max(20),

    // Conscientiousness facets
    competence: z.number().min(0).max(20),
    order: z.number().min(0).max(20),
    dutifulness: z.number().min(0).max(20),
    achievementStriving: z.number().min(0).max(20),
    selfDiscipline: z.number().min(0).max(20),
    deliberation: z.number().min(0).max(20),

    // Extraversion facets
    warmth: z.number().min(0).max(20),
    gregariousness: z.number().min(0).max(20),
    assertiveness: z.number().min(0).max(20),
    activity: z.number().min(0).max(20),
    excitementSeeking: z.number().min(0).max(20),
    positiveEmotions: z.number().min(0).max(20),

    // Agreeableness facets
    trust: z.number().min(0).max(20),
    straightforwardness: z.number().min(0).max(20),
    altruism: z.number().min(0).max(20),
    compliance: z.number().min(0).max(20),
    modesty: z.number().min(0).max(20),
    tenderMindedness: z.number().min(0).max(20),

    // Neuroticism facets
    anxiety: z.number().min(0).max(20),
    angryHostility: z.number().min(0).max(20),
    depression: z.number().min(0).max(20),
    selfConsciousness: z.number().min(0).max(20),
    impulsiveness: z.number().min(0).max(20),
    vulnerability: z.number().min(0).max(20),
  }),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  traits: PersonalityTraitsSchema.optional(),
  completed: z.boolean().default(false),
});

export const sendMessageContract = oc
  .input(
    z.object({
      sessionId: z.string(),
      message: z.string().min(1).max(1000),
    }),
  )
  .output(ChatMessageSchema);

export const getMessagesContract = oc
  .input(
    z.object({
      sessionId: z.string(),
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .output(z.array(ChatMessageSchema));

export const createSessionContract = oc
  .input(
    z.object({
      userId: z.string().optional(),
    }),
  )
  .output(ChatSessionSchema);

export const getSessionContract = oc
  .input(
    z.object({
      sessionId: z.string(),
    }),
  )
  .output(ChatSessionSchema.nullable());

// Therapist assessment contracts
export const therapistAssessmentSessionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completed: z.boolean().default(false),
});

export const startTherapistAssessmentContract = oc
  .input(
    z.object({
      userId: z.string().optional(),
    }),
  )
  .output(therapistAssessmentSessionSchema);

export const therapistMessageEventSchema = z.union([
  z.object({
    type: z.literal("response"),
    chunk: z.string(),
  }),
  z.object({
    type: z.literal("traits"),
    traits: PersonalityTraitPrecisionSchema,
    completed: z.boolean(),
  }),
  z.object({
    type: z.literal("complete"),
    traits: PersonalityTraitPrecisionSchema,
  }),
]);

export const sendTherapistMessageContract = oc
  .input(
    z.object({
      sessionId: z.string(),
      message: z.string().min(1).max(2000).optional(),
      evaluateNow: z.boolean().optional(), // Trigger evaluation on demand
    }),
  )
  .output(eventIterator(therapistMessageEventSchema));

export const getTherapistResultsContract = oc
  .input(
    z.object({
      sessionId: z.string(),
    }),
  )
  .output(
    z.object({
      traits: PersonalityTraitPrecisionSchema.optional(),
      completed: z.boolean(),
    }),
  );

export const contract = {
  planet: {
    list: listPlanetContract,
    find: findPlanetContract,
    create: createPlanetContract,
  },
  chat: {
    sendMessage: sendMessageContract,
    getMessages: getMessagesContract,
    createSession: createSessionContract,
    getSession: getSessionContract,
    startTherapistAssessment: startTherapistAssessmentContract,
    sendTherapistMessage: sendTherapistMessageContract,
    getTherapistResults: getTherapistResultsContract,
  },
};
