/**
 * Spine Extractor (Stage A) — inferential brief only.
 * Raw conversation MUST NOT appear here; input is UserSummary + facet scores only (ADR-51).
 */

export const SPINE_EXTRACTOR_JSON_CONTRACT = `Return a single JSON object matching this TypeScript shape (no markdown fences, no prose outside JSON):

{
  "insight": {
    "surfaceObservation": string,
    "underneathReading": string,
    "bridge": string,
    "falsifiable": boolean
  },
  "thread": string,
  "lens": string,
  "arc": {
    "wonder": MovementBeat,
    "recognition": MovementBeat,
    "tension": MovementBeat,
    "embrace": MovementBeat,
    "reframe": MovementBeat,
    "compulsion": MovementBeat
  },
  "coinedPhraseTargets": Array<{ "phrase": string, "rationale": string, "echoesIn": MovementName[] }>,
  "ordinaryMomentAnchors": Array<{ "moment": string, "verbatim"?: string, "useIn": MovementName, "supportsInsight": boolean }>,
  "unresolvedCost": { "description": string, "verbatim"?: string },
  "voiceAdjustments"?: Array<{ "movement": MovementName, "tone": string }>
}

type MovementName = "wonder" | "recognition" | "tension" | "embrace" | "reframe" | "compulsion";

interface MovementBeat {
  "focus": string,
  "openingDirection": string,
  "keyMaterial": string[],
  "endState": string
}

Rules:
- Every MovementBeat must serve insight.insight (especially underneathReading), not decorate generically.
- coinedPhraseTargets: at least 2 items; each phrase echoed in at least 2 movements via echoesIn.
- ordinaryMomentAnchors: include ≥1 verbatim from quoteBank when possible.
- unresolvedCost: concrete, not reframed into a moral lesson.
`;

export function buildSpineExtractorUserPrompt(params: {
	readonly userSummaryBlock: string;
	readonly facetTraitBlock: string;
	readonly gapFeedbackBlock?: string;
}): string {
	const retry = params.gapFeedbackBlock?.trim()
		? `\n\nVERIFIER GAP FEEDBACK — address before rewriting the brief:\n${params.gapFeedbackBlock}\n`
		: "";

	return `You are Stage A of Nerin's portrait pipeline. Produce ONLY valid JSON for the contract below.

USER STATE (canonical compressed input — prioritize themes and verbatim anchors):
${params.userSummaryBlock}

SCORES AND PROFILE (derive specificity from facets; do not invent facts beyond UserSummary + scores):
${params.facetTraitBlock}
${retry}

${SPINE_EXTRACTOR_JSON_CONTRACT}`;
}
