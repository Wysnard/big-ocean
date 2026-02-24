import { describe, expect, it } from "vitest";
import { NERIN_PERSONA } from "../../constants/nerin-persona";
import { buildChatSystemPrompt } from "../nerin-system-prompt";

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

	it("appends CONVERSATION CLOSING section when nearingEnd is true (Story 10.5)", () => {
		const prompt = buildChatSystemPrompt({ nearingEnd: true });
		expect(prompt).toContain("CONVERSATION CLOSING:");
		expect(prompt).toContain("nearing its natural end");
		expect(prompt).toContain("warm, reflective closing");
		expect(prompt).not.toContain("STEERING PRIORITY:");
	});

	it("does not include CONVERSATION CLOSING when nearingEnd is false or absent", () => {
		const prompt = buildChatSystemPrompt({});
		expect(prompt).not.toContain("CONVERSATION CLOSING:");
	});

	it("suppresses steering when nearingEnd is true (closing overrides steering)", () => {
		const prompt = buildChatSystemPrompt({
			targetDomain: "relationships",
			targetFacet: "trust",
			nearingEnd: true,
		});
		expect(prompt).not.toContain("STEERING PRIORITY:");
		expect(prompt).toContain("CONVERSATION CLOSING:");
	});
});
