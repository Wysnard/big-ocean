/**
 * Level-Specific Trait Descriptions (Story 8.2)
 *
 * Provides taglines and level-specific descriptions for each Big Five trait.
 * Each trait has 3 levels keyed by their trait-specific letters (e.g., "P"|"G"|"O" for Openness).
 * Descriptions use second-person voice ("you tend to...") for a personal, warm feel.
 *
 * This is a pure domain constant — no API calls, no DB lookups.
 * The level letter from the API response is the direct lookup key.
 */

import type { TraitName } from "../constants/big-five";
import type {
	AgreeablenessLevel,
	ConscientiousnessLevel,
	ExtraversionLevel,
	NeuroticismLevel,
	OpennessLevel,
} from "../types/archetype";

/** Maps each trait to its specific level type for strict key enforcement */
type TraitLevelMap = {
	openness: OpennessLevel;
	conscientiousness: ConscientiousnessLevel;
	extraversion: ExtraversionLevel;
	agreeableness: AgreeablenessLevel;
	neuroticism: NeuroticismLevel;
};

/** Type-safe trait descriptions structure — each trait's levels only accept its own letter keys */
type TraitDescriptionsType = {
	[K in TraitName]: {
		tagline: string;
		levels: Record<TraitLevelMap[K], string>;
	};
};

export const TRAIT_DESCRIPTIONS = {
	openness: {
		tagline: "How you engage with new ideas and experiences",
		levels: {
			P: "Proven methods and concrete results guide your decisions. You trust direct experience over abstract theories and bring a grounded, no-nonsense perspective others rely on.",
			G: "New ideas catch your attention when they make sense, but passing trends rarely pull you off course. You blend curiosity with pragmatism and adapt without losing your bearings.",
			O: "Novel experiences and unconventional thinking draw you in naturally. You question the status quo, spot possibilities where others see limits, and thrive on curiosity.",
		},
	},
	conscientiousness: {
		tagline: "How you organize your life and pursue goals",
		levels: {
			F: "Keeping your options open feels more natural than rigid plans. You pivot easily when things change, trust your instincts, and do your best work with room to improvise.",
			B: "Structure and flexibility blend in how you get things done. You follow through on commitments but know when to adjust course, handling deadlines and open-ended challenges alike.",
			D: "Thoroughness defines your approach. You set clear goals, plan ahead, and hold yourself to high standards — others rely on you because they know the job will get done.",
		},
	},
	extraversion: {
		tagline: "How you direct your energy and engage socially",
		levels: {
			I: "Quiet reflection and one-on-one conversations recharge you. Depth matters more than breadth — a small circle of close friends suits you better than a wide social network.",
			A: "Social energy and solitude both have a place in your life. A lively gathering one evening, a quiet night in the next — you shift between them with ease.",
			E: "Being around people is what charges your batteries. You bring others together naturally, keep conversations alive, and put people at ease with your warmth.",
		},
	},
	agreeableness: {
		tagline: "How you relate to others and handle conflict",
		levels: {
			C: "Directness sits at the center of how you interact. You speak your mind respectfully but firmly, valuing candor over smoothing things over. People know where they stand.",
			N: "Reading the room is second nature. You hold firm when it matters and compromise when it serves the greater good — people often look to you to find common ground.",
			W: "Empathy and care shape your relationships. You go out of your way to make others feel supported, give people the benefit of the doubt, and build deep, lasting trust.",
		},
	},
	neuroticism: {
		tagline: "How you experience and process emotions",
		levels: {
			R: "A steady emotional baseline carries you through pressure and setbacks. You stay calm, recover quickly, and make clear-headed decisions even when the stakes are high.",
			T: "Highs and lows both register genuinely, but a solid internal process keeps you moving forward. Self-awareness helps you handle what comes up without getting stuck.",
			S: "Emotions run deep — joy and stress both hit with real intensity. That sensitivity fuels sharp intuition, genuine empathy, and a rich inner life others may not see.",
		},
	},
} as const satisfies TraitDescriptionsType;

/** Derived type — inferred from the `as const` object for consumers that need the shape */
export type TraitDescriptions = typeof TRAIT_DESCRIPTIONS;
