/**
 * Level-Specific Facet Descriptions (Story 8.3)
 *
 * Provides level-specific descriptions for each of the 30 Big Five facets.
 * Each facet has 2 levels keyed by their two-letter codes from FACET_LETTER_MAP.
 * Descriptions use second-person voice for a personal, warm feel.
 *
 * This is a pure domain constant — no API calls, no DB lookups.
 * The level code from getFacetLevel() is the direct lookup key.
 */

import type { FacetName } from "../constants/big-five";

export const FACET_DESCRIPTIONS = {
	// ─── Openness Facets ─────────────────────────────────────────────────────

	imagination: {
		levels: {
			OP: "You anchor conversations in what's real and tangible, preferring tested solutions over abstract speculation.",
			OV: "Your mind drifts into vivid possibilities — you're always imagining how things could be different or better.",
		},
	},

	artistic_interests: {
		levels: {
			OL: "You value function over form and focus on what works rather than how it looks or sounds.",
			OA: "Beauty catches your eye everywhere — a striking design, a moving melody, or light falling just right.",
		},
	},

	emotionality: {
		levels: {
			OS: "You keep a level head when feelings run high, processing emotions internally before letting them surface.",
			OE: "You tune into your own emotions with ease, using that awareness to navigate decisions and relationships.",
		},
	},

	adventurousness: {
		levels: {
			OC: "You find comfort in familiar routines and trusted methods — consistency is how you build momentum.",
			OD: "New experiences pull you in. You'd rather try something unfamiliar than stick with the same old pattern.",
		},
	},

	intellect: {
		levels: {
			OF: "You zero in on what matters and apply knowledge practically rather than chasing every curiosity.",
			OI: "Ideas light you up — you love exploring concepts, debating possibilities, and learning for its own sake.",
		},
	},

	liberalism: {
		levels: {
			OT: "You respect established values and time-tested conventions, seeing stability as a foundation for growth.",
			OR: "You question norms and re-examine assumptions, believing progress comes from challenging the status quo.",
		},
	},

	// ─── Conscientiousness Facets ────────────────────────────────────────────

	self_efficacy: {
		levels: {
			CD: "You prefer to seek input before jumping in, making sure you have the right support before committing.",
			CA: "You trust your ability to handle what comes your way and tackle challenges with quiet confidence.",
		},
	},

	orderliness: {
		levels: {
			CS: "You thrive in loose, adaptive environments where you can shift gears without rigid structure slowing you down.",
			CM: "You thrive with clear systems and organized spaces — when things are out of place, you notice and fix it.",
		},
	},

	dutifulness: {
		levels: {
			CI: "You follow your own compass first, honouring commitments but not letting obligation override personal judgment.",
			CO: "When you give your word, you follow through. Responsibility and reliability are core to how you operate.",
		},
	},

	achievement_striving: {
		levels: {
			CR: "You take life at a comfortable pace, finding satisfaction in the journey rather than chasing milestones.",
			CE: "Ambition fuels you — you set high standards, track your progress, and push until the goal is reached.",
		},
	},

	self_discipline: {
		levels: {
			CF: "You work best when inspiration strikes, moving between tasks fluidly rather than grinding through a list.",
			CP: "Once you start something, you see it through. Distractions rarely pull you off course for long.",
		},
	},

	cautiousness: {
		levels: {
			CB: "You trust your instincts and act quickly when opportunity arises — deliberation rarely holds you back.",
			CL: "You weigh options carefully before committing, preferring a well-considered choice over a hasty one.",
		},
	},

	// ─── Extraversion Facets ─────────────────────────────────────────────────

	friendliness: {
		levels: {
			ER: "You warm up gradually, keeping a respectful distance until a genuine connection earns your openness.",
			EW: "You put people at ease quickly, radiating warmth that makes strangers feel like friends in minutes.",
		},
	},

	gregariousness: {
		levels: {
			ES: "You recharge in solitude and prefer meaningful one-on-one conversations over crowded social events.",
			EG: "You come alive in a crowd, drawing energy from lively gatherings and seeking out shared experiences.",
		},
	},

	assertiveness: {
		levels: {
			ED: "You lead by listening, giving space for others to speak before weighing in with your perspective.",
			EA: "You step up and take charge naturally, expressing your views with confidence and clarity.",
		},
	},

	activity_level: {
		levels: {
			EC: "You move at a measured pace, savouring downtime and avoiding unnecessary rush in your daily life.",
			EB: "You keep a full schedule and a fast pace — sitting still too long makes you restless.",
		},
	},

	excitement_seeking: {
		levels: {
			EP: "You find contentment in calm, predictable settings and don't need thrills to feel engaged.",
			ET: "You crave new sensations and stimulating experiences — routine bores you quickly.",
		},
	},

	cheerfulness: {
		levels: {
			EM: "You express positive feelings quietly, carrying a steady contentment that doesn't demand attention.",
			EL: "Joy comes easily to you and spreads outward — your upbeat energy is contagious.",
		},
	},

	// ─── Agreeableness Facets ────────────────────────────────────────────────

	trust: {
		levels: {
			AS: "You verify before you trust, watching actions over words to decide who deserves your confidence.",
			AT: "You extend trust readily, believing most people have good intentions until proven otherwise.",
		},
	},

	morality: {
		levels: {
			AD: "You navigate social situations strategically, reading between the lines to protect your interests.",
			AI: "Honesty and fairness guide your interactions — you say what you mean and play by the rules.",
		},
	},

	altruism: {
		levels: {
			AF: "You handle your own needs first, offering help selectively so your energy goes where it counts.",
			AG: "Helping others comes naturally — you notice what people need and step in without being asked.",
		},
	},

	cooperation: {
		levels: {
			AC: "You stand your ground in disagreements, viewing healthy friction as a path to better outcomes.",
			AH: "You seek common ground instinctively, smoothing tensions so everyone walks away satisfied.",
		},
	},

	modesty: {
		levels: {
			AO: "You own your strengths openly and aren't shy about sharing your accomplishments when relevant.",
			AU: "You let your work speak for itself, deflecting praise and lifting up the people around you.",
		},
	},

	sympathy: {
		levels: {
			AL: "You approach others' problems with clear-eyed analysis, offering solutions rather than just comfort.",
			AE: "You feel what others feel — their struggles move you, and your compassion shows in how you respond.",
		},
	},

	// ─── Neuroticism Facets ──────────────────────────────────────────────────

	anxiety: {
		levels: {
			NC: "Worry rarely takes hold — you face uncertainty with a calm, even-keeled mindset.",
			NA: "You stay alert to what could go wrong, channelling that vigilance into thorough preparation.",
		},
	},

	anger: {
		levels: {
			NP: "Frustration builds slowly in you — it takes a lot to push you past your threshold.",
			NF: "Irritation flares fast when things feel unjust, giving you the fire to push back and set things right.",
		},
	},

	depression: {
		levels: {
			NB: "You bounce back quickly from setbacks, keeping a bright outlook even when things get tough.",
			NS: "Heavy feelings linger, and sadness can settle in deeply — but that depth also fuels empathy and art.",
		},
	},

	self_consciousness: {
		levels: {
			NU: "Social judgment barely registers — you move through groups with natural, unshakable ease.",
			NW: "You're keenly aware of how others see you, using that awareness to read rooms with precision.",
		},
	},

	immoderation: {
		levels: {
			ND: "You exercise steady self-control, keeping impulses in check without much internal struggle.",
			NI: "Cravings hit hard and fast — you act on desire in the moment, worrying about consequences later.",
		},
	},

	vulnerability: {
		levels: {
			NR: "Pressure doesn't rattle you — you keep functioning clearly even when demands pile up.",
			NV: "Stress hits you intensely, but that sensitivity also means you pick up on subtleties others miss.",
		},
	},
} as const satisfies Record<FacetName, { levels: Record<string, string> }>;

/** Derived type — preserves literal key types for type-safe lookups */
export type FacetDescriptions = typeof FACET_DESCRIPTIONS;
