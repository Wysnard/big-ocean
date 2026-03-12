import { describe, expect, it } from "vitest";
import { NERIN_PERSONA } from "../../constants/nerin-persona";
import { buildChatSystemPrompt } from "../nerin-system-prompt";
import { buildTerritoryPrompt } from "../steering/territory-prompt-builder";

describe("buildChatSystemPrompt — behavior and steering", () => {
	it("contains genuine enthusiasm examples (AC5 — moved from persona)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("I love that — I haven't heard someone put it quite like that");
	});

	it("contains passive mirroring anti-pattern (AC5 — moved from persona)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("Never passively mirror");
	});

	it("contains instructional anti-pattern (AC5 — moved from persona)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("Never tell people how to behave in the conversation");
	});

	it("contains self-analyst edge case note (AC4)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("don't compete with it");
	});

	it("contains parrotfish warning annotation (AC3)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("USE CAREFULLY: implies nobody sees their contribution");
	});

	it("does not include steering section when no params provided", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).not.toContain("STEERING PRIORITY:");
		expect(prompt).not.toContain("TERRITORY GUIDANCE:");
	});

	// Story 21-5: Territory Prompt Integration
	describe("Story 21-5 — territory prompt integration", () => {
		const territoryContent = buildTerritoryPrompt({
			territoryId: "creative-pursuits" as any,
		});

		it("includes territory guidance section when territoryPrompt is provided", () => {
			const prompt = buildChatSystemPrompt({ territoryPrompt: territoryContent });
			expect(prompt).toContain("TERRITORY GUIDANCE:");
			expect(prompt).toContain(territoryContent.opener);
		});

		it("territory opener appears as suggested direction", () => {
			const prompt = buildChatSystemPrompt({ territoryPrompt: territoryContent });
			expect(prompt).toContain("Suggested direction");
			expect(prompt).toContain(territoryContent.opener);
		});

		it("includes energy guidance level in the territory section", () => {
			const prompt = buildChatSystemPrompt({ territoryPrompt: territoryContent });
			expect(prompt).toContain(territoryContent.energyGuidanceLevel);
		});

		it("includes domain area in the territory section", () => {
			const prompt = buildChatSystemPrompt({ territoryPrompt: territoryContent });
			for (const domain of territoryContent.domains) {
				expect(prompt).toContain(domain);
			}
		});

		it("includes persona in output", () => {
			const prompt = buildChatSystemPrompt({ territoryPrompt: territoryContent });
			expect(prompt).toContain(NERIN_PERSONA);
		});

		it("no params produces no steering section", () => {
			const prompt = buildChatSystemPrompt();
			expect(prompt).not.toContain("STEERING PRIORITY:");
			expect(prompt).not.toContain("TERRITORY GUIDANCE:");
		});
	});
});
