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
		gradientClassName: "bg-gradient-to-r from-primary via-tertiary to-secondary",
	},
	portrait: {
		phase: "portrait",
		sectionId: "homepage-phase-portrait",
		textBefore: "Words you've been",
		keyword: "CARRYING",
		textAfter: "without knowing.",
		gradientClassName: "bg-gradient-to-r from-secondary via-primary to-tertiary",
	},
	worldAfter: {
		phase: "worldAfter",
		sectionId: "homepage-phase-world-after",
		textBefore: "A place that",
		keyword: "STAYS",
		textAfter: "",
		gradientClassName: "bg-gradient-to-r from-tertiary via-primary to-secondary",
	},
	reassurance: {
		phase: "reassurance",
		sectionId: "homepage-phase-reassurance",
		textBefore: "",
		keyword: "YOURS",
		textAfter: "",
		gradientClassName: "bg-gradient-to-r from-primary via-secondary to-tertiary",
	},
};

export function isHomepagePhase(value: string | null | undefined): value is HomepagePhase {
	return HOMEPAGE_PHASE_ORDER.includes(value as HomepagePhase);
}

export function getHomepagePhaseConfig(phase: HomepagePhase) {
	return HOMEPAGE_PHASE_CONFIG[phase];
}
