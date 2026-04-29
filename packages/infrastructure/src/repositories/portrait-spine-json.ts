import type { MovementName, SpineBrief } from "@workspace/domain/types/spine-brief";
import type { SpineVerification } from "@workspace/domain/types/spine-verification";

const MOVEMENTS = ["wonder", "recognition", "tension", "embrace", "reframe", "compulsion"] as const;

function isMovementName(s: unknown): s is MovementName {
	return typeof s === "string" && (MOVEMENTS as readonly string[]).includes(s);
}

function isMovementBeat(x: unknown): x is SpineBrief["arc"]["wonder"] {
	if (typeof x !== "object" || x === null) return false;
	const o = x as Record<string, unknown>;
	return (
		typeof o.focus === "string" &&
		typeof o.openingDirection === "string" &&
		Array.isArray(o.keyMaterial) &&
		o.keyMaterial.every((k) => typeof k === "string") &&
		typeof o.endState === "string"
	);
}

/** Minimal structural validation — LLM contract enforcement lives in prompts + verifier. */
export function parseSpineBriefJson(raw: string, sessionId: string): SpineBrief {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw) as unknown;
	} catch {
		throw new Error(`Invalid JSON for SpineBrief (session ${sessionId})`);
	}
	if (typeof parsed !== "object" || parsed === null) {
		throw new Error(`SpineBrief root must be object (session ${sessionId})`);
	}
	const o = parsed as Record<string, unknown>;
	if (
		typeof o.thread !== "string" ||
		typeof o.lens !== "string" ||
		typeof o.insight !== "object" ||
		o.insight === null ||
		typeof o.arc !== "object" ||
		o.arc === null
	) {
		throw new Error(`SpineBrief missing required fields (session ${sessionId})`);
	}
	const insight = o.insight as Record<string, unknown>;
	if (
		typeof insight.surfaceObservation !== "string" ||
		typeof insight.underneathReading !== "string" ||
		typeof insight.bridge !== "string" ||
		typeof insight.falsifiable !== "boolean"
	) {
		throw new Error(`SpineBrief.insight invalid (session ${sessionId})`);
	}
	const arc = o.arc as Record<string, unknown>;
	for (const m of MOVEMENTS) {
		if (!isMovementBeat(arc[m])) {
			throw new Error(`SpineBrief.arc.${m} invalid MovementBeat (session ${sessionId})`);
		}
	}
	if (!Array.isArray(o.coinedPhraseTargets)) {
		throw new Error(`SpineBrief.coinedPhraseTargets must be array (session ${sessionId})`);
	}
	for (const row of o.coinedPhraseTargets) {
		if (typeof row !== "object" || row === null) {
			throw new Error(`SpineBrief.coinedPhraseTargets row invalid (session ${sessionId})`);
		}
		const c = row as Record<string, unknown>;
		if (
			typeof c.phrase !== "string" ||
			typeof c.rationale !== "string" ||
			!Array.isArray(c.echoesIn)
		) {
			throw new Error(`SpineBrief.coinedPhraseTargets fields invalid (session ${sessionId})`);
		}
		for (const echo of c.echoesIn) {
			if (!isMovementName(echo)) {
				throw new Error(`SpineBrief.coinedPhraseTargets.echoesIn invalid (session ${sessionId})`);
			}
		}
	}
	if (!Array.isArray(o.ordinaryMomentAnchors)) {
		throw new Error(`SpineBrief.ordinaryMomentAnchors must be array (session ${sessionId})`);
	}
	for (const row of o.ordinaryMomentAnchors) {
		if (typeof row !== "object" || row === null) {
			throw new Error(`SpineBrief.ordinaryMomentAnchors row invalid (session ${sessionId})`);
		}
		const a = row as Record<string, unknown>;
		if (
			typeof a.moment !== "string" ||
			(a.verbatim !== undefined && typeof a.verbatim !== "string") ||
			!isMovementName(a.useIn) ||
			typeof a.supportsInsight !== "boolean"
		) {
			throw new Error(`SpineBrief.ordinaryMomentAnchors fields invalid (session ${sessionId})`);
		}
	}
	if (typeof o.unresolvedCost !== "object" || o.unresolvedCost === null) {
		throw new Error(`SpineBrief.unresolvedCost missing (session ${sessionId})`);
	}
	const u = o.unresolvedCost as Record<string, unknown>;
	if (
		typeof u.description !== "string" ||
		(u.verbatim !== undefined && typeof u.verbatim !== "string")
	) {
		throw new Error(`SpineBrief.unresolvedCost fields invalid (session ${sessionId})`);
	}
	if (o.voiceAdjustments !== undefined) {
		if (!Array.isArray(o.voiceAdjustments)) {
			throw new Error(`SpineBrief.voiceAdjustments must be array (session ${sessionId})`);
		}
		for (const row of o.voiceAdjustments) {
			if (typeof row !== "object" || row === null) continue;
			const v = row as Record<string, unknown>;
			if (!isMovementName(v.movement) || typeof v.tone !== "string") {
				throw new Error(`SpineBrief.voiceAdjustments fields invalid (session ${sessionId})`);
			}
		}
	}
	return parsed as SpineBrief;
}

export function parseSpineVerificationJson(raw: string, sessionId: string): SpineVerification {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw) as unknown;
	} catch {
		throw new Error(`Invalid JSON for SpineVerification (session ${sessionId})`);
	}
	if (typeof parsed !== "object" || parsed === null) {
		throw new Error(`SpineVerification root must be object (session ${sessionId})`);
	}
	const v = parsed as Record<string, unknown>;
	if (
		typeof v.passed !== "boolean" ||
		typeof v.overallScore !== "number" ||
		typeof v.gapFeedback !== "string" ||
		!Array.isArray(v.missingFields) ||
		!Array.isArray(v.shallowAreas)
	) {
		throw new Error(`SpineVerification missing required fields (session ${sessionId})`);
	}
	if (!v.missingFields.every((x) => typeof x === "string")) {
		throw new Error(`SpineVerification.missingFields must be string[] (session ${sessionId})`);
	}
	if (!v.shallowAreas.every((x) => typeof x === "string")) {
		throw new Error(`SpineVerification.shallowAreas must be string[] (session ${sessionId})`);
	}
	return parsed as SpineVerification;
}

/** Strip optional markdown fences from model output */
export function unwrapJsonFence(text: string): string {
	const t = text.trim();
	const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/m.exec(t);
	return fence?.[1]?.trim() ?? t;
}
