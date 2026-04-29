/**
 * Portrait pipeline prompt regression (Story 22-3 fingerprint block superseded by ADR-51).
 *
 * Contradiction / rare-combination spine discovery is no longer inlined in `PORTRAIT_CONTEXT`
 * — Stage A produces a structured `SpineBrief`; Stage C renders brief-only.
 */

import { PORTRAIT_CONTEXT, SPINE_EXTRACTOR_JSON_CONTRACT } from "@workspace/domain";
import { describe, expect, it } from "vitest";

describe("Portrait pipeline prompts (ADR-51)", () => {
	it("PORTRAIT_CONTEXT instructs Stage C brief-only rendering", () => {
		expect(PORTRAIT_CONTEXT).toContain("ADR-51 — BRIEF-ONLY RENDERING (STAGE C)");
		expect(PORTRAIT_CONTEXT).toContain("You do **not** receive the raw conversation");
		expect(PORTRAIT_CONTEXT).toContain("SpineBrief JSON in the user message");
	});

	it("Spine Extractor JSON contract still defines structured brief shape", () => {
		expect(SPINE_EXTRACTOR_JSON_CONTRACT).toContain("MovementBeat");
		expect(SPINE_EXTRACTOR_JSON_CONTRACT).toContain("coinedPhraseTargets");
	});
});
