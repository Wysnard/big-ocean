/**
 * Portrait Generator Contradiction-Surfacing Tests (Story 22-3)
 *
 * Verifies that the contradiction-surfacing instruction was added to the
 * full portrait generator prompt and NOT to the teaser portrait prompt.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Read source file content for prompt verification.
 * We read the source files directly rather than importing private constants,
 * following the same approach as prompt content tests elsewhere.
 */
function readSourceFile(relativePath: string): string {
	return readFileSync(resolve(__dirname, "..", relativePath), "utf-8");
}

describe("Story 22-3: Contradiction-Surfacing in Portrait Generator", () => {
	const portraitSource = readSourceFile("portrait-generator.claude.repository.ts");
	const teaserSource = readSourceFile("teaser-portrait.anthropic.repository.ts");

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

	it("teaser portrait does NOT contain contradiction-surfacing instruction", () => {
		expect(teaserSource).not.toContain("Look for contradictions and tensions in the evidence");
		expect(teaserSource).not.toContain("Surface them as discoveries, not diagnoses");
	});
});
