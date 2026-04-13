export type HomepagePhase = "conversation" | "portrait" | "worldAfter" | "reassurance";

export interface HomepagePhaseConfig {
	phase: HomepagePhase;
	sectionId: string;
	textBefore: string;
	keyword: string;
	textAfter: string;
	gradientClassName: string;
}

export const HOMEPAGE_PHASE_ORDER: HomepagePhase[] = [
	"conversation",
	"portrait",
	"worldAfter",
	"reassurance",
];

export const HOMEPAGE_PHASE_CONFIG: Record<HomepagePhase, HomepagePhaseConfig> = {
	conversation: {
		phase: "conversation",
		sectionId: "homepage-phase-conversation",
		textBefore: "A conversation that",
		keyword: "SEES",
		textAfter: "you.",
		gradientClassName:
			"bg-gradient-to-r from-sky-400 via-violet-500 to-sky-400 dark:from-sky-300 dark:via-violet-400 dark:to-sky-300",
	},
	portrait: {
		phase: "portrait",
		sectionId: "homepage-phase-portrait",
		textBefore: "Words you've been",
		keyword: "CARRYING",
		textAfter: "without knowing.",
		gradientClassName:
			"bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400 dark:from-amber-300 dark:via-rose-300 dark:to-amber-300",
	},
	worldAfter: {
		phase: "worldAfter",
		sectionId: "homepage-phase-world-after",
		textBefore: "A place that",
		keyword: "STAYS",
		textAfter: ".",
		gradientClassName:
			"bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 dark:from-teal-300 dark:via-cyan-300 dark:to-teal-300",
	},
	reassurance: {
		phase: "reassurance",
		sectionId: "homepage-phase-reassurance",
		textBefore: "",
		keyword: "YOURS.",
		textAfter: "",
		gradientClassName:
			"bg-gradient-to-r from-violet-400 via-rose-400 to-amber-400 dark:from-violet-300 dark:via-rose-300 dark:to-amber-300",
	},
};

export function isHomepagePhase(value: string | null | undefined): value is HomepagePhase {
	return HOMEPAGE_PHASE_ORDER.includes(value as HomepagePhase);
}

export function getHomepagePhaseConfig(phase: HomepagePhase) {
	return HOMEPAGE_PHASE_CONFIG[phase];
}
