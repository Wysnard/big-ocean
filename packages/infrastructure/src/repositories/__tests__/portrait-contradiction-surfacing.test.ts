/**
 * Portrait Generator Contradiction-Surfacing Tests (Story 22-3)
 *
 * Verifies that the contradiction-surfacing instruction was added to the
 * full portrait generator prompt.
 *
 * PORTRAIT_CONTEXT was extracted from infrastructure to domain (portrait-context.ts).
 * Tests now import the constant directly rather than reading source files.
 */

import { PORTRAIT_CONTEXT } from "@workspace/domain";
import { describe, expect, it } from "vitest";

describe("Story 22-3: Contradiction-Surfacing in Portrait Generator", () => {
	const portraitSource = PORTRAIT_CONTEXT;

	it("full portrait prompt contains contradiction-surfacing instruction", () => {
		expect(portraitSource).toContain("Look for contradictions and tensions in the evidence");
		expect(portraitSource).toContain("Surface them as discoveries, not diagnoses");
	});

	it("contradiction-surfacing is placed in the BEFORE YOU WRITE section", () => {
		// The instruction should appear between "BEFORE YOU WRITE" header and "Step 1:"
		const beforeWriteIdx = portraitSource.indexOf("BEFORE YOU WRITE");
		const contradictionIdx = portraitSource.indexOf("Look for contradictions and tensions");
		const step1Idx = portraitSource.indexOf("Step 1: Identify");

		expect(beforeWriteIdx).toBeGreaterThan(-1);
		expect(contradictionIdx).toBeGreaterThan(beforeWriteIdx);
		expect(contradictionIdx).toBeLessThan(step1Idx);
	});
});
