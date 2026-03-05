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

	it("appends steering section with domain and facet when provided (Story 9.2)", () => {
		const prompt = buildChatSystemPrompt({ targetDomain: "relationships", targetFacet: "trust" });
		expect(prompt).toContain("STEERING PRIORITY:");
		expect(prompt).toContain('"trust"');
		expect(prompt).toContain('"relationships"');
		expect(prompt).toContain("This is your next exploration target");
		expect(prompt).toContain("Transition to this territory within your next 1-2 responses");
	});

	it("does not contain old steering text format", () => {
		const prompt = buildChatSystemPrompt({ targetDomain: "work", targetFacet: "orderliness" });
		expect(prompt).not.toContain("Current conversation focus:");
		expect(prompt).not.toContain("Naturally guide the conversation");
	});

	it("does not include steering section when no domain/facet provided", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).not.toContain("STEERING PRIORITY:");
	});

	it("combines persona, chat context, and steering when domain+facet provided", () => {
		const prompt = buildChatSystemPrompt({ targetDomain: "work", targetFacet: "orderliness" });
		expect(prompt).toContain(NERIN_PERSONA);
		expect(prompt).toContain("CONVERSATION MODE:");
		expect(prompt).toContain("STEERING PRIORITY:");
		expect(prompt).toContain('"orderliness"');
		expect(prompt).toContain('"work"');
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

		it("does NOT include facet-targeting steering when territoryPrompt is provided", () => {
			const prompt = buildChatSystemPrompt({ territoryPrompt: territoryContent });
			expect(prompt).not.toContain("STEERING PRIORITY:");
		});

		it("territory opener appears as suggested direction", () => {
			const prompt = buildChatSystemPrompt({ territoryPrompt: territoryContent });
			expect(prompt).toContain("Suggested direction");
			expect(prompt).toContain(territoryContent.opener);
		});

		it("includes energy level in the territory section", () => {
			const prompt = buildChatSystemPrompt({ territoryPrompt: territoryContent });
			expect(prompt).toContain(territoryContent.energyLevel);
		});

		it("includes domain area in the territory section", () => {
			const prompt = buildChatSystemPrompt({ territoryPrompt: territoryContent });
			for (const domain of territoryContent.domains) {
				expect(prompt).toContain(domain);
			}
		});

		it("territory prompt takes precedence over legacy steering params", () => {
			const prompt = buildChatSystemPrompt({
				territoryPrompt: territoryContent,
				targetDomain: "work",
				targetFacet: "orderliness",
			});
			expect(prompt).toContain("TERRITORY GUIDANCE:");
			expect(prompt).not.toContain("STEERING PRIORITY:");
		});

		it("backward compatibility: no territory prompt uses existing steering", () => {
			const prompt = buildChatSystemPrompt({ targetDomain: "work", targetFacet: "orderliness" });
			expect(prompt).toContain("STEERING PRIORITY:");
			expect(prompt).not.toContain("TERRITORY GUIDANCE:");
		});

		it("backward compatibility: no params produces no steering section", () => {
			const prompt = buildChatSystemPrompt();
			expect(prompt).not.toContain("STEERING PRIORITY:");
			expect(prompt).not.toContain("TERRITORY GUIDANCE:");
		});
	});
});
