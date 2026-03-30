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

	it("full portrait prompt contains fingerprint principle (contradictions + rare combinations)", () => {
		expect(portraitSource).toContain("CONTRADICTIONS: Two traits that seemingly oppose each other");
		expect(portraitSource).toContain("RARE COMBINATIONS: Unusual alliances between traits");
		expect(portraitSource).toContain(
			"Surface both as discoveries you're genuinely fascinated by, not diagnoses",
		);
	});

	it("fingerprint principle is placed in the BEFORE YOU WRITE section", () => {
		// The instruction should appear between "BEFORE YOU WRITE" header and "Step 1:"
		const beforeWriteIdx = portraitSource.indexOf("BEFORE YOU WRITE");
		const fingerprintIdx = portraitSource.indexOf("CONTRADICTIONS: Two traits");
		const step1Idx = portraitSource.indexOf("Step 1: Identify");

		expect(beforeWriteIdx).toBeGreaterThan(-1);
		expect(fingerprintIdx).toBeGreaterThan(beforeWriteIdx);
		expect(fingerprintIdx).toBeLessThan(step1Idx);
	});
});
