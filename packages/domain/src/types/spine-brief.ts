/**
 * SpineBrief — prescriptive JSON brief produced by Stage A (Spine Extractor).
 * Stage C (Prose Renderer) reads ONLY this + PORTRAIT_CONTEXT craft rules.
 *
 * @see ADR-51 in _bmad-output/planning-artifacts/architecture.md
 */

export type MovementName =
	| "wonder"
	| "recognition"
	| "tension"
	| "embrace"
	| "reframe"
	| "compulsion";

export interface MovementBeat {
	readonly focus: string;
	readonly openingDirection: string;
	readonly keyMaterial: readonly string[];
	readonly endState: string;
}

export interface SpineBrief {
	readonly insight: {
		readonly surfaceObservation: string;
		readonly underneathReading: string;
		readonly bridge: string;
		readonly falsifiable: boolean;
	};
	readonly thread: string;
	readonly lens: string;
	readonly arc: {
		readonly wonder: MovementBeat;
		readonly recognition: MovementBeat;
		readonly tension: MovementBeat;
		readonly embrace: MovementBeat;
		readonly reframe: MovementBeat;
		readonly compulsion: MovementBeat;
	};
	readonly coinedPhraseTargets: ReadonlyArray<{
		readonly phrase: string;
		readonly rationale: string;
		readonly echoesIn: readonly MovementName[];
	}>;
	readonly ordinaryMomentAnchors: ReadonlyArray<{
		readonly moment: string;
		readonly verbatim?: string;
		readonly useIn: MovementName;
		readonly supportsInsight: boolean;
	}>;
	readonly unresolvedCost: {
		readonly description: string;
		readonly verbatim?: string;
	};
	readonly voiceAdjustments?: ReadonlyArray<{
		readonly movement: MovementName;
		readonly tone: string;
	}>;
}
