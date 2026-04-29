/**
 * Mock implementations for ADR-51 portrait pipeline stages — E2E / integration tests.
 */

import {
	PortraitProseRendererRepository,
	SpineExtractorRepository,
	SpineVerifierRepository,
} from "@workspace/domain";
import type { SpineBrief } from "@workspace/domain/types/spine-brief";
import type { SpineVerification } from "@workspace/domain/types/spine-verification";
import { Effect, Layer } from "effect";

/** Minimal valid SpineBrief for deterministic mocks. */
const MOCK_SPINE_BRIEF: SpineBrief = {
	insight: {
		surfaceObservation: "Mock surface",
		underneathReading: "Mock underneath",
		bridge: "Mock bridge",
		falsifiable: true,
	},
	thread: "mock-thread",
	lens: "mock-lens",
	arc: {
		wonder: {
			focus: "w",
			openingDirection: "open",
			keyMaterial: ["a"],
			endState: "end",
		},
		recognition: {
			focus: "w",
			openingDirection: "open",
			keyMaterial: ["a"],
			endState: "end",
		},
		tension: {
			focus: "w",
			openingDirection: "open",
			keyMaterial: ["a"],
			endState: "end",
		},
		embrace: {
			focus: "w",
			openingDirection: "open",
			keyMaterial: ["a"],
			endState: "end",
		},
		reframe: {
			focus: "w",
			openingDirection: "open",
			keyMaterial: ["a"],
			endState: "end",
		},
		compulsion: {
			focus: "w",
			openingDirection: "open",
			keyMaterial: ["a"],
			endState: "end",
		},
	},
	coinedPhraseTargets: [
		{ phrase: "one", rationale: "r", echoesIn: ["wonder", "recognition"] },
		{ phrase: "two", rationale: "r2", echoesIn: ["tension", "embrace"] },
	],
	ordinaryMomentAnchors: [{ moment: "m1", useIn: "wonder", supportsInsight: true }],
	unresolvedCost: { description: "mock cost" },
};

const MOCK_PORTRAIT = `# Mock portrait

E2E pipeline output — **spine + prose** stages satisfied with deterministic text.`;

const MOCK_VERIFICATION: SpineVerification = {
	passed: true,
	missingFields: [],
	shallowAreas: [],
	overallScore: 1,
	gapFeedback: "",
};

export const SpineExtractorMockRepositoryLive = Layer.succeed(
	SpineExtractorRepository,
	SpineExtractorRepository.of({
		extractSpineBrief: () => Effect.succeed(MOCK_SPINE_BRIEF),
	}),
);

export const SpineVerifierMockRepositoryLive = Layer.succeed(
	SpineVerifierRepository,
	SpineVerifierRepository.of({
		verifySpineBrief: () => Effect.succeed(MOCK_VERIFICATION),
	}),
);

export const PortraitProseRendererMockRepositoryLive = Layer.succeed(
	PortraitProseRendererRepository,
	PortraitProseRendererRepository.of({
		renderPortraitProse: () => Effect.succeed(MOCK_PORTRAIT),
	}),
);
