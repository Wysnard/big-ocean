/**
 * Move Governor — Story 26-3
 *
 * Thin restraint-and-context layer that derives conversational intent,
 * computes entry pressure, and wires observation gating to produce
 * PromptBuilderInput. The Governor handles what LLMs are bad at
 * (frequency control, entry pressure calibration) and trusts Nerin
 * for what it's naturally good at (conversational action choice).
 *
 * Pure function — no Effect dependencies, no I/O.
 * All values operate in [0, 1] space per NFR1.
 *
 * @see {@link file://_bmad-output/planning-artifacts/conversation-pacing-design-decisions.md} Decision 12
 */

import type { LifeDomain } from "../../constants/life-domain";
import type {
	AmplifyPromptInput,
	ConversationalIntent,
	ContradictionTarget,
	ConvergenceTarget,
	EntryPressure,
	EntryPressureDebug,
	ExplorePromptInput,
	MoveGovernorDebug,
	ObservationGatingDebug,
	OpenPromptInput,
	PromptBuilderInput,
} from "../../types/pacing";
import type { TerritoryId } from "../../types/territory";
import { evaluateObservationGating, type ObservationGatingInput } from "./observation-gating";

// ─── Constants ──────────────────────────────────────────────────────

/**
 * Entry pressure gap threshold for "angled" entry.
 * Gap > MODERATE_GAP and <= LARGE_GAP -> "angled".
 * Simulation-derived default, named for calibration.
 */
export const ENTRY_PRESSURE_MODERATE_GAP = 0.15;

/**
 * Entry pressure gap threshold for "soft" entry.
 * Gap > LARGE_GAP -> "soft".
 * Simulation-derived default, named for calibration.
 */
export const ENTRY_PRESSURE_LARGE_GAP = 0.30;

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Input to the Move Governor.
 *
 * The pipeline caller is responsible for computing all observation
 * strengths, phase, and shared fire count before calling the Governor.
 * The Governor receives pre-computed values and orchestrates them
 * into PromptBuilderInput.
 */
export interface MoveGovernorInput {
	/** The selected territory for this turn */
	readonly selectedTerritory: TerritoryId;
	/** E_target from the pacing formula (null if unavailable, e.g., first turn) */
	readonly eTarget: number | null;
	/** Current turn number (1-based) */
	readonly turnNumber: number;
	/** Whether this is the final turn of the session */
	readonly isFinalTurn: boolean;
	/** The territory's expected energy cost [0, 1] */
	readonly expectedEnergy: number;
	/** The previous turn's territory (null on first turn) */
	readonly previousTerritory: TerritoryId | null;
	// ── Observation gating inputs (pre-computed by pipeline) ──
	/** Evidence-derived phase for observation gating */
	readonly phase: number;
	/** Number of prior non-Relate observations in this session */
	readonly sharedFireCount: number;
	/** Raw strength for Relate focus */
	readonly relateStrength: number;
	/** Raw strength for Noticing focus */
	readonly noticingStrength: number;
	/** Raw strength for Contradiction focus */
	readonly contradictionStrength: number;
	/** Raw strength for Convergence focus */
	readonly convergenceStrength: number;
	/** Target data for noticing — which domain to notice */
	readonly noticingDomain?: LifeDomain;
	/** Target data for contradiction — the divergent facet/domain pair */
	readonly contradictionTarget?: ContradictionTarget;
	/** Target data for convergence — the convergent facet/domains */
	readonly convergenceTarget?: ConvergenceTarget;
}

/** Result of the Move Governor computation. */
export interface MoveGovernorResult {
	readonly output: PromptBuilderInput;
	readonly debug: MoveGovernorDebug;
}

// ─── Intent Derivation ──────────────────────────────────────────────

/**
 * Derive the conversational intent from turn position.
 *
 * Priority: open (turn 1) > amplify (final) > explore (everything else).
 * Open takes priority even on a single-turn session.
 */
export function deriveIntent(
	turnNumber: number,
	isFinalTurn: boolean,
): ConversationalIntent {
	if (turnNumber === 1) return "open";
	if (isFinalTurn) return "amplify";
	return "explore";
}

// ─── Entry Pressure ─────────────────────────────────────────────────

/**
 * Compute entry pressure from the gap between E_target and territory expectedEnergy.
 *
 * Gap = max(0, expectedEnergy - eTarget). When the territory is easier
 * than E_target (negative gap), clamped to 0 -> direct.
 *
 * Thresholds:
 * - gap <= 0.15 -> "direct" (comfortable range)
 * - gap <= 0.30 -> "angled" (moderate gap)
 * - gap > 0.30  -> "soft" (large gap)
 *
 * Returns "direct" when eTarget is null (no pacing data available).
 */
export function computeEntryPressure(
	eTarget: number | null,
	expectedEnergy: number,
): EntryPressureDebug {
	if (eTarget === null) {
		return {
			level: "direct",
			eTarget: 0,
			expectedEnergy,
			gap: 0,
		};
	}

	const gap = Math.max(0, expectedEnergy - eTarget);

	let level: EntryPressure;
	if (gap <= ENTRY_PRESSURE_MODERATE_GAP) {
		level = "direct";
	} else if (gap <= ENTRY_PRESSURE_LARGE_GAP) {
		level = "angled";
	} else {
		level = "soft";
	}

	return {
		level,
		eTarget,
		expectedEnergy,
		gap,
	};
}

// ─── Governor Orchestrator ──────────────────────────────────────────

/** Default observation gating debug for open intent (gating skipped). */
const OPEN_GATING_DEBUG: ObservationGatingDebug = {
	mode: "explore",
	phase: 0,
	threshold: 0,
	sharedFireCount: 0,
	candidates: [],
	winner: null,
	mutualExclusionApplied: false,
};

/**
 * Compute the Governor's output: PromptBuilderInput + MoveGovernorDebug.
 *
 * Orchestrates three decisions:
 * 1. Intent derivation (open / explore / amplify)
 * 2. Entry pressure (direct / angled / soft)
 * 3. Observation gating (which focus wins)
 *
 * Then shapes the result into the correct PromptBuilderInput variant.
 */
export function computeGovernorOutput(input: MoveGovernorInput): MoveGovernorResult {
	const intent = deriveIntent(input.turnNumber, input.isFinalTurn);

	// ── Open intent: territory only, skip pressure + gating ──
	if (intent === "open") {
		const output: OpenPromptInput = {
			intent: "open",
			territory: input.selectedTerritory,
		};

		const entryPressureDebug = computeEntryPressure(input.eTarget, input.expectedEnergy);

		const debug: MoveGovernorDebug = {
			intent: "open",
			isFinalTurn: input.isFinalTurn,
			entryPressure: entryPressureDebug,
			observationGating: OPEN_GATING_DEBUG,
		};

		return { output, debug };
	}

	// ── Amplify intent: direct entry, amplify-mode gating ──
	if (intent === "amplify") {
		const gatingInput: ObservationGatingInput = {
			mode: "amplify",
			phase: input.phase,
			sharedFireCount: input.sharedFireCount,
			relateStrength: input.relateStrength,
			noticingStrength: input.noticingStrength,
			contradictionStrength: input.contradictionStrength,
			convergenceStrength: input.convergenceStrength,
			noticingDomain: input.noticingDomain,
			contradictionTarget: input.contradictionTarget,
			convergenceTarget: input.convergenceTarget,
		};

		const gatingResult = evaluateObservationGating(gatingInput);

		const output: AmplifyPromptInput = {
			intent: "amplify",
			territory: input.selectedTerritory,
			entryPressure: "direct",
			observationFocus: gatingResult.focus,
		};

		const debug: MoveGovernorDebug = {
			intent: "amplify",
			isFinalTurn: true,
			entryPressure: {
				level: "direct",
				eTarget: input.eTarget ?? 0,
				expectedEnergy: input.expectedEnergy,
				gap: 0,
			},
			observationGating: gatingResult.debug,
		};

		return { output, debug };
	}

	// ── Explore intent: full entry pressure + explore-mode gating ──
	const entryPressureDebug = computeEntryPressure(input.eTarget, input.expectedEnergy);

	const gatingInput: ObservationGatingInput = {
		mode: "explore",
		phase: input.phase,
		sharedFireCount: input.sharedFireCount,
		relateStrength: input.relateStrength,
		noticingStrength: input.noticingStrength,
		contradictionStrength: input.contradictionStrength,
		convergenceStrength: input.convergenceStrength,
		noticingDomain: input.noticingDomain,
		contradictionTarget: input.contradictionTarget,
		convergenceTarget: input.convergenceTarget,
	};

	const gatingResult = evaluateObservationGating(gatingInput);

	const output: ExplorePromptInput = {
		intent: "explore",
		territory: input.selectedTerritory,
		entryPressure: entryPressureDebug.level,
		observationFocus: gatingResult.focus,
	};

	const debug: MoveGovernorDebug = {
		intent: "explore",
		isFinalTurn: false,
		entryPressure: entryPressureDebug,
		observationGating: gatingResult.debug,
	};

	return { output, debug };
}
