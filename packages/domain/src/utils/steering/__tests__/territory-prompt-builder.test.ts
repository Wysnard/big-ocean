/**
 * Territory Prompt Builder Tests -- Story 21-5
 *
 * Tests for the territory prompt builder that looks up territories
 * from the catalog and formats guidance for Nerin's system prompt.
 *
 * Tests verify: correct catalog lookup, prompt contains opener/domains/energy
 * but NOT facets/DRS/coverage, and invalid ID error handling.
 */
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { TERRITORY_CATALOG } from "../../../constants/territory-catalog";
import type { TerritoryId } from "../../../types/territory";
import { TerritoryIdSchema } from "../../../types/territory";
import {
	buildTerritoryPrompt,
	buildTerritorySystemPromptSection,
} from "../territory-prompt-builder";

// ─── Helpers ──────────────────────────────────────────────────────────

const tid = (s: string): TerritoryId => Schema.decodeSync(TerritoryIdSchema)(s);

// ─── buildTerritoryPrompt ─────────────────────────────────────────────

describe("buildTerritoryPrompt", () => {
	it("returns correct opener, domains, and energyLevel for a valid territory ID", () => {
		const result = buildTerritoryPrompt({ territoryId: tid("creative-pursuits") });
		const territory = TERRITORY_CATALOG.get(tid("creative-pursuits"))!;

		expect(result.opener).toBe(territory.opener);
		expect(result.domains).toEqual(territory.domains);
		expect(result.energyLevel).toBe(territory.energyLevel);
	});

	it("works for medium-energy territory", () => {
		const result = buildTerritoryPrompt({ territoryId: tid("work-dynamics") });
		expect(result.energyLevel).toBe("medium");
		expect(result.domains).toEqual(["work"]);
		expect(result.opener).toContain("challenge");
	});

	it("works for heavy-energy territory", () => {
		const result = buildTerritoryPrompt({ territoryId: tid("family-bonds") });
		expect(result.energyLevel).toBe("heavy");
		expect(result.domains).toEqual(["family"]);
	});

	it("throws descriptive error for invalid territory ID", () => {
		expect(() => buildTerritoryPrompt({ territoryId: tid("nonexistent-territory") })).toThrow(
			/territory.*not found/i,
		);
	});

	it("does NOT include expectedFacets in the returned content", () => {
		const result = buildTerritoryPrompt({ territoryId: tid("creative-pursuits") });
		// TerritoryPromptContent should only have opener, domains, energyLevel
		const keys = Object.keys(result);
		expect(keys).not.toContain("expectedFacets");
		expect(keys).toEqual(expect.arrayContaining(["opener", "domains", "energyLevel"]));
	});
});

// ─── buildTerritorySystemPromptSection ─────────────────────────────────

describe("buildTerritorySystemPromptSection", () => {
	it("output contains opener text", () => {
		const content = buildTerritoryPrompt({ territoryId: tid("creative-pursuits") });
		const section = buildTerritorySystemPromptSection(content);
		expect(section).toContain(content.opener);
	});

	it("output contains domain names", () => {
		const content = buildTerritoryPrompt({ territoryId: tid("work-dynamics") });
		const section = buildTerritorySystemPromptSection(content);
		expect(section).toContain("work");
	});

	it("output contains energy level", () => {
		const content = buildTerritoryPrompt({ territoryId: tid("family-bonds") });
		const section = buildTerritorySystemPromptSection(content);
		expect(section).toContain("heavy");
	});

	it("output does NOT contain facets, DRS, or coverage data", () => {
		const content = buildTerritoryPrompt({ territoryId: tid("creative-pursuits") });
		const section = buildTerritorySystemPromptSection(content);
		expect(section).not.toContain("imagination");
		expect(section).not.toContain("artistic_interests");
		expect(section).not.toContain("adventurousness");
		expect(section).not.toContain("DRS");
		expect(section).not.toContain("coverage");
	});

	it("presents opener as suggested direction, not mandatory question", () => {
		const content = buildTerritoryPrompt({ territoryId: tid("creative-pursuits") });
		const section = buildTerritorySystemPromptSection(content);
		// Should frame the opener as a suggestion
		expect(section).toMatch(/suggest|direction|could|might|consider/i);
	});

	it("includes energy-specific guidance for light territories", () => {
		const content = buildTerritoryPrompt({ territoryId: tid("creative-pursuits") });
		const section = buildTerritorySystemPromptSection(content);
		expect(section).toMatch(/light|casual|low.?stakes|approachable/i);
	});

	it("includes energy-specific guidance for heavy territories", () => {
		const content = buildTerritoryPrompt({ territoryId: tid("family-bonds") });
		const section = buildTerritorySystemPromptSection(content);
		expect(section).toMatch(/heavy|deep|emotional|vulnerable/i);
	});
});
