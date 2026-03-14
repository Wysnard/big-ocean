/**
 * Observation Gating & Competition — Story 26-2
 *
 * Controls when non-Relate observations fire using evidence-derived phase
 * and escalating thresholds. "Seen" moments are rare, earned, and
 * increasingly scarce — spending emotional currency wisely.
 *
 * Two modes:
 * - **explore**: phase-gated threshold with mutual exclusion
 *   (contradiction > convergence > noticing). Relate wins by default.
 * - **close**: raw strength argmax across all four focuses.
 *   Relate is a competitor, not a fallback.
 *
 * All values operate in [0, 1] space per NFR1.
 * Constants are named and easily adjustable for calibration.
 */

import type { LifeDomain } from "../../constants/life-domain";
import type {
	ContradictionTarget,
	ConvergenceTarget,
	ObservationCandidate,
	ObservationFocus,
	ObservationGatingDebug,
} from "../../types/pacing";

// ─── Constants ──────────────────────────────────────────────────────

/**
 * Named constants for observation gating.
 * Simulation-derived defaults requiring future empirical calibration.
 */
export const OBSERVATION_GATING_CONSTANTS = Object.freeze({
	/** Base threshold for non-Relate observation to fire */
	OBSERVE_BASE: 0.12,
	/** Per-fire threshold step — escalates linearly with shared fire count */
	OBSERVE_STEP: 0.04,
});

// ─── Types ──────────────────────────────────────────────────────────

/** Gating mode: explore (phase-gated) or close (raw competition) */
export type ObservationGatingMode = "explore" | "close";

/**
 * Input to the observation gating function.
 *
 * The caller provides pre-computed raw strengths (from Story 26-1),
 * evidence-derived phase, shared fire count, and optional target data
 * for contradiction/convergence/noticing observations.
 */
export interface ObservationGatingInput {
	readonly mode: ObservationGatingMode;
	/** Evidence-derived phase: mean(confidence_f for f where confidence_f > 0) / C_MAX */
	readonly phase: number;
	/** Number of prior non-Relate observations in this session (derive-at-read) */
	readonly sharedFireCount: number;
	/** Raw strength for Relate focus (energy x telling) */
	readonly relateStrength: number;
	/** Raw strength for Noticing focus (smoothed clarity) */
	readonly noticingStrength: number;
	/** Raw strength for Contradiction focus (delta x min confidence) */
	readonly contradictionStrength: number;
	/** Raw strength for Convergence focus (1 - spread) x min confidence */
	readonly convergenceStrength: number;
	/** Target data for noticing — which domain to notice */
	readonly noticingDomain?: LifeDomain;
	/** Target data for contradiction — the divergent facet/domain pair */
	readonly contradictionTarget?: ContradictionTarget;
	/** Target data for convergence — the convergent facet/domains */
	readonly convergenceTarget?: ConvergenceTarget;
}

/** Result of observation gating: the winning focus and debug info */
export interface ObservationGatingResult {
	readonly focus: ObservationFocus;
	readonly debug: ObservationGatingDebug;
}

// ─── Internal Types ─────────────────────────────────────────────────

/** Internal candidate with priority for mutual exclusion */
interface RankedCandidate {
	readonly focus: ObservationFocus;
	readonly rawStrength: number;
	readonly effectiveStrength: number;
	/** Lower = higher priority (contradiction=0, convergence=1, noticing=2, relate=3) */
	readonly priority: number;
}

// ─── Implementation ─────────────────────────────────────────────────

/**
 * Compute the threshold for non-Relate observation to fire.
 *
 * threshold(n) = OBSERVE_BASE + OBSERVE_STEP * n
 *
 * Escalates linearly: n=0 -> 0.12, n=1 -> 0.16, n=2 -> 0.20, ...
 */
function computeThreshold(sharedFireCount: number): number {
	const { OBSERVE_BASE, OBSERVE_STEP } = OBSERVATION_GATING_CONSTANTS;
	return OBSERVE_BASE + OBSERVE_STEP * sharedFireCount;
}

/**
 * Build the four candidates with their raw and effective strengths.
 */
function buildCandidates(input: ObservationGatingInput): RankedCandidate[] {
	const isExplore = input.mode === "explore";

	const relateFocus: ObservationFocus = { type: "relate" };
	const noticingFocus: ObservationFocus = { type: "noticing", domain: input.noticingDomain ?? ("work" as LifeDomain) };
	const contradictionFocus: ObservationFocus = input.contradictionTarget
		? { type: "contradiction", target: input.contradictionTarget }
		: { type: "contradiction", target: { facet: "Openness to Experience" as any, pair: [] as any, strength: 0 } };
	const convergenceFocus: ObservationFocus = input.convergenceTarget
		? { type: "convergence", target: input.convergenceTarget }
		: { type: "convergence", target: { facet: "Openness to Experience" as any, domains: [], strength: 0 } };

	return [
		{
			focus: contradictionFocus,
			rawStrength: input.contradictionStrength,
			effectiveStrength: isExplore
				? input.contradictionStrength * input.phase
				: input.contradictionStrength,
			priority: 0,
		},
		{
			focus: convergenceFocus,
			rawStrength: input.convergenceStrength,
			effectiveStrength: isExplore
				? input.convergenceStrength * input.phase
				: input.convergenceStrength,
			priority: 1,
		},
		{
			focus: noticingFocus,
			rawStrength: input.noticingStrength,
			effectiveStrength: isExplore
				? input.noticingStrength * input.phase
				: input.noticingStrength,
			priority: 2,
		},
		{
			focus: relateFocus,
			rawStrength: input.relateStrength,
			// Relate is never phase-gated — its effective strength equals raw
			effectiveStrength: input.relateStrength,
			priority: 3,
		},
	];
}

/**
 * Evaluate observation gating for explore mode.
 *
 * - effectiveStrength = rawStrength * phase for non-Relate candidates
 * - Non-Relate fires if effectiveStrength > threshold(n)
 * - Mutual exclusion: at most one non-Relate, priority: contradiction > convergence > noticing
 * - If nothing clears -> Relate wins by default
 */
function evaluateExplore(
	candidates: RankedCandidate[],
	threshold: number,
): { winner: RankedCandidate; mutualExclusionApplied: boolean } {
	// Filter non-Relate candidates that clear the threshold
	const nonRelate = candidates.filter(
		(c) => c.focus.type !== "relate" && c.effectiveStrength > threshold,
	);

	if (nonRelate.length === 0) {
		// Relate wins by default
		const relate = candidates.find((c) => c.focus.type === "relate")!;
		return { winner: relate, mutualExclusionApplied: false };
	}

	// Sort by priority (lower = higher priority) for mutual exclusion
	nonRelate.sort((a, b) => a.priority - b.priority);
	const mutualExclusionApplied = nonRelate.length > 1;

	// nonRelate is guaranteed non-empty (checked above)
	return { winner: nonRelate[0]!, mutualExclusionApplied };
}

/**
 * Evaluate observation gating for close mode.
 *
 * All four focuses compete on raw strength — no phase gating, no threshold.
 * Winner = argmax of raw strengths.
 * Tiebreak by priority: contradiction > convergence > noticing > relate.
 */
function evaluateClose(
	candidates: RankedCandidate[],
): { winner: RankedCandidate; mutualExclusionApplied: boolean } {
	// Sort by raw strength descending, then by priority ascending (tiebreak)
	const sorted = [...candidates].sort((a, b) => {
		if (b.rawStrength !== a.rawStrength) return b.rawStrength - a.rawStrength;
		return a.priority - b.priority;
	});

	// sorted is guaranteed non-empty (candidates always has 4 entries)
	return { winner: sorted[0]!, mutualExclusionApplied: false };
}

/**
 * Evaluate observation gating to determine which ObservationFocus wins.
 *
 * @param input - Pre-computed raw strengths, phase, fire count, mode, and target data
 * @returns The winning ObservationFocus and debug information
 */
export function evaluateObservationGating(input: ObservationGatingInput): ObservationGatingResult {
	const threshold = input.mode === "explore" ? computeThreshold(input.sharedFireCount) : 0;
	const candidates = buildCandidates(input);

	const { winner, mutualExclusionApplied } =
		input.mode === "explore"
			? evaluateExplore(candidates, threshold)
			: evaluateClose(candidates);

	// Build ObservationCandidate[] for debug output
	const debugCandidates: ObservationCandidate[] = candidates.map((c) => ({
		focus: c.focus,
		strength: c.effectiveStrength,
	}));

	const debug: ObservationGatingDebug = {
		mode: input.mode,
		phase: input.phase,
		threshold,
		sharedFireCount: input.sharedFireCount,
		candidates: debugCandidates,
		winner: winner.focus,
		mutualExclusionApplied,
	};

	return { focus: winner.focus, debug };
}
