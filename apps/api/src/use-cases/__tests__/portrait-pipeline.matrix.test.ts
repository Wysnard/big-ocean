/**
 * Portrait pipeline regression matrix — ADR-51 quality seams.
 *
 * @see docs/portrait-pipeline.md
 */

import {
	buildPortraitProseUserPrompt,
	buildSpineExtractorUserPrompt,
	buildSpineVerifierUserPrompt,
} from "@workspace/domain";
import { describe, expect, it } from "vitest";

describe("Portrait pipeline matrix (ADR-51 invariants)", () => {
	it("Stage C user prompt is brief-only (no UserSummary / conversation scaffold)", () => {
		const userPrompt = buildPortraitProseUserPrompt('{"thread":"t","lens":"l"}');
		expect(userPrompt).not.toMatch(/USER STATE/i);
		expect(userPrompt).not.toMatch(/QUOTE BANK/i);
		expect(userPrompt).not.toMatch(/THEMES:/i);
		expect(userPrompt).toContain("SPINE BRIEF JSON");
	});

	it("Stage A user prompt includes UserSummary + scores blocks (not raw message arrays)", () => {
		const p = buildSpineExtractorUserPrompt({
			userSummaryBlock: "SUMMARY",
			facetTraitBlock: "SCORES",
		});
		expect(p).toContain("USER STATE");
		expect(p).toContain("SCORES");
		expect(p).not.toMatch(/"role"\s*:\s*"user"/);
	});

	it("Stage B user prompt wraps only the brief JSON", () => {
		const p = buildSpineVerifierUserPrompt('{"thread":"x"}');
		expect(p).toContain("SPINE BRIEF JSON");
		expect(p).toContain('"thread":"x"');
	});
});
