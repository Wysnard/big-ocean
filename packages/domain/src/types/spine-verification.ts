/**
 * SpineVerification — Stage B (Spine Verifier) judgment on a SpineBrief.
 *
 * @see ADR-51 in _bmad-output/planning-artifacts/architecture.md
 */

export interface SpineVerification {
	readonly passed: boolean;
	readonly missingFields: readonly string[];
	readonly shallowAreas: readonly string[];
	readonly overallScore: number;
	readonly gapFeedback: string;
}
