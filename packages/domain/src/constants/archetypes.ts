/**
 * Hand-Curated Archetype Data
 *
 * Maps 4-letter OCEAN codes (O,C,E,A) to memorable personality archetype names,
 * descriptions, and colors. Covers the 25 most common/meaningful combinations.
 * Remaining combinations (out of 81 total) use the fallback generator.
 *
 * Letter system:
 *   Openness:          P (Practical)  G (Grounded)    O (Open-minded)
 *   Conscientiousness: F (Flexible)   B (Balanced)    D (Disciplined)
 *   Extraversion:      I (Introvert)  A (Ambivert)    E (Extravert)
 *   Agreeableness:     C (Candid)     N (Negotiator)  W (Warm)
 */

/**
 * Teaser trait letter options for generating plausible but randomized OCEAN codes
 * Used in auth gates to show a teaser code that looks real but doesn't reveal actual results
 *
 * Maps trait index to available letters for that trait:
 * 0: Openness (P/G/O)
 * 1: Conscientiousness (F/B/D)
 * 2: Extraversion (I/A/E)
 * 3: Agreeableness (C/N/W)
 * 4: Neuroticism (R/T/S) - Note: N is used for Agreeableness
 */
export const TEASER_TRAIT_LETTERS = [
	["P", "G", "O"], // Openness
	["F", "B", "D"], // Conscientiousness
	["I", "A", "E"], // Extraversion
	["C", "N", "W"], // Agreeableness
	["R", "T", "S"], // Neuroticism
] as const;

/**
 * Curated archetype entry (without code4 and isCurated, which are derived).
 */
export interface CuratedArchetypeEntry {
	readonly name: string;
	readonly description: string;
	readonly color: string;
}

/**
 * Hand-curated archetype entries indexed by 4-letter OCEAN code.
 *
 * Each entry provides a memorable name, 2-3 sentence description,
 * and a representative hex color. The code order is O-C-E-A,
 * using trait-specific letters.
 */
export const CURATED_ARCHETYPES: Record<string, CuratedArchetypeEntry> = {
	// HHHH → ODEW
	ODEW: {
		name: "The Idealist",
		description:
			"Creative and organized with a vibrant social energy and deep compassion. You bring imaginative ideas to life through disciplined action while nurturing meaningful connections with everyone you meet.",
		color: "#6B5CE7",
	},
	// HHHL → ODEC
	ODEC: {
		name: "The Visionary Planner",
		description:
			"Innovative yet structured, you combine a rich inner world with meticulous execution. Your outgoing nature draws people in, while your independent streak ensures your ideas remain uniquely your own.",
		color: "#4A7FC7",
	},
	// HHMH → ODAW
	ODAW: {
		name: "The Creative Diplomat",
		description:
			"Open-minded and organized with a reserved warmth that runs deep. You approach challenges with both imagination and careful planning, building trust through quiet consistency and genuine care.",
		color: "#5B8FA8",
	},
	// HHLH → ODIW
	ODIW: {
		name: "The Thoughtful Collaborator",
		description:
			"Imaginative and meticulous with a preference for deeper one-on-one connections. You bring creative solutions to the table while maintaining a supportive, cooperative spirit that others rely on.",
		color: "#7B9E6B",
	},
	// HMHH → OBEW
	OBEW: {
		name: "The Curious Leader",
		description:
			"Open to new experiences and naturally energetic in social settings. Your pragmatic approach to details combined with genuine kindness makes you a magnetic presence who inspires others to explore.",
		color: "#E8A04C",
	},
	// HMMM → OBAN
	OBAN: {
		name: "The Balanced Explorer",
		description:
			"Driven by curiosity and openness to new ideas while maintaining balance in daily life. You adapt naturally to different situations, bringing a fresh perspective without extremes in any direction.",
		color: "#8E7CC3",
	},
	// HLHH → OFEW
	OFEW: {
		name: "The Free Spirit",
		description:
			"Creatively spontaneous with a warm, social energy that lights up a room. You embrace new experiences with open arms and minimal planning, connecting with others through authentic enthusiasm and generosity.",
		color: "#FF8C42",
	},
	// MHHH → GDEW
	GDEW: {
		name: "The Steady Organizer",
		description:
			"Practical and highly disciplined with a gift for bringing people together. Your moderate openness to new ideas is balanced by exceptional organizational skills and a genuinely caring nature.",
		color: "#4CAF7B",
	},
	// MMHH → GBEW
	GBEW: {
		name: "The Social Connector",
		description:
			"Balanced in perspective and adaptable in approach, you thrive in social environments. Your moderate nature across most dimensions makes you approachable and warm, a natural bridge between different groups.",
		color: "#FFB347",
	},
	// MMMM → GBAN
	GBAN: {
		name: "The Centered Moderate",
		description:
			"Remarkably balanced across all personality dimensions, you bring stability and adaptability wherever you go. Your centered nature allows you to understand different perspectives and respond with measured thoughtfulness.",
		color: "#808080",
	},
	// MMLH → GBIW
	GBIW: {
		name: "The Quiet Helper",
		description:
			"Pragmatic and relaxed in your approach to life with a deeply caring heart. You prefer meaningful one-on-one interactions where your quiet generosity and genuine empathy can make the biggest impact.",
		color: "#7DCEA0",
	},
	// LHHH → PDEW
	PDEW: {
		name: "The Traditional Leader",
		description:
			"Grounded in convention with exceptional organizational ability and social confidence. You bring people together through reliable structures and warm encouragement, preferring proven methods over untested ideas.",
		color: "#2E8B57",
	},
	// LHLH → PDIW
	PDIW: {
		name: "The Dependable Supporter",
		description:
			"Practical and disciplined with a quiet loyalty that runs deep. You prefer familiar approaches and well-tested methods, providing unwavering support to those you care about through consistent, reliable action.",
		color: "#5F9EA0",
	},
	// LMHH → GBEW already used for MMHH, this is PBEW
	PBEW: {
		name: "The Energetic Realist",
		description:
			"Grounded and flexible with a natural social energy and warmth. You navigate the world with practical wisdom, bringing people together through genuine friendliness and a preference for what works.",
		color: "#DAA520",
	},
	// LLHH → PFEW
	PFEW: {
		name: "The Social Pragmatist",
		description:
			"Traditional and easygoing with an outgoing, friendly nature. You build connections through straightforward warmth and practical reliability, preferring action over abstract theorizing.",
		color: "#CD853F",
	},
	// LLLL → PFIC
	PFIC: {
		name: "The Reserved Pragmatist",
		description:
			"Practical and spontaneous with a quiet, self-reliant nature. You prefer doing things your own way without much fanfare, finding satisfaction in straightforward approaches and independent thinking.",
		color: "#696969",
	},
	// HLLH → OFIW
	OFIW: {
		name: "The Creative Maverick",
		description:
			"Highly imaginative and spontaneous with a cooperative spirit hidden beneath a quiet exterior. You forge your own creative path while maintaining deep loyalty to those in your inner circle.",
		color: "#9B59B6",
	},
	// HLHL → OFEC
	OFEC: {
		name: "The Adventurous Thinker",
		description:
			"Open-minded and spontaneous with a social confidence and independent spirit. You pursue new ideas and experiences with enthusiasm, comfortable charting your own course in a crowd.",
		color: "#E67E22",
	},
	// LHHL → PDEC
	PDEC: {
		name: "The Principled Achiever",
		description:
			"Traditional yet highly disciplined, you combine social confidence with fierce independence. You pursue goals with methodical determination, valuing proven systems and self-reliance above all.",
		color: "#2C3E50",
	},
	// LHLL → PDIC
	PDIC: {
		name: "The Quiet Strategist",
		description:
			"Conventional and systematic with a preference for solitude and self-direction. You approach challenges with careful planning and autonomous execution, building reliable frameworks that stand the test of time.",
		color: "#34495E",
	},
	// MHLH → GDIW
	GDIW: {
		name: "The Devoted Planner",
		description:
			"Moderately open with a highly organized mind and a deeply caring heart. You prefer the quiet satisfaction of helping others through careful preparation and reliable follow-through.",
		color: "#27AE60",
	},
	// HMLL →OBIC
	OBIC: {
		name: "The Curious Loner",
		description:
			"Intellectually open and curious with a preference for solitude and independence. You explore ideas and experiences on your own terms, valuing personal freedom and the life of the mind above social convention.",
		color: "#8E44AD",
	},
	// HHLL → ODIC
	ODIC: {
		name: "The Systematic Innovator",
		description:
			"Creative yet organized, reserved yet purposeful. You channel imaginative ideas through structured processes, preferring to work independently and let the quality of your output speak for itself.",
		color: "#2980B9",
	},
	// LMML → PBAC
	PBAC: {
		name: "The Grounded Individual",
		description:
			"Traditional and moderate with an independent streak. You navigate life with practical wisdom and balanced expectations, comfortable in your own skin without needing validation from others.",
		color: "#95A5A6",
	},
	// HHMM → ODAN
	ODAN: {
		name: "The Thoughtful Creator",
		description:
			"Open and organized with a balanced approach to social interaction and warmth. You bring creative ideas to life through careful planning, maintaining meaningful connections without overextending yourself.",
		color: "#5DADE2",
	},
};
