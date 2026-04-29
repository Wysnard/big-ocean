/**
 * Spine Verifier (Stage B) — judges SpineBrief only (ADR-51).
 */

export const SPINE_VERIFIER_JSON_CONTRACT = `Return a single JSON object (no markdown fences):

{
  "passed": boolean,
  "missingFields": string[],
  "shallowAreas": string[],
  "overallScore": number,
  "gapFeedback": string
}

Scoring rubric (mechanical):
- Structural completeness of SpineBrief
- Specificity (thread ties to concrete material)
- Insight distinctness (surface vs underneath not redundant)
- Insight falsifiability (underneath could be wrong)
- Arc serves insight (movements not interchangeable)
- ≥2 coined phrases each referenced in ≥2 movements
- ≥1 verbatim anchor when quoteBank existed in upstream extraction context

If passed is false, gapFeedback MUST be actionable for Stage A re-extraction (bullet-like sentences).`;

export function buildSpineVerifierUserPrompt(briefJson: string): string {
	return `${SPINE_VERIFIER_JSON_CONTRACT}

SPINE BRIEF JSON (evaluate ONLY this object — no UserSummary, no scores, no conversation):

${briefJson}`;
}
