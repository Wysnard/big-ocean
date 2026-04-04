import { describe, expect, it } from "vitest";
import { ACTOR_BRIEF_FRAMING, ACTOR_VOICE_RULES, buildActorPrompt } from "../nerin-actor-prompt";
import { NERIN_PERSONA } from "../nerin-persona";

describe("ACTOR_VOICE_RULES", () => {
	it("includes emoji hand signals guidance", () => {
		expect(ACTOR_VOICE_RULES).toContain("Emoji are hand signals");
		expect(ACTOR_VOICE_RULES).toContain("sparse, deliberate, ocean-themed");
	});

	it("includes humor boundary", () => {
		expect(ACTOR_VOICE_RULES).toContain("Humor is dry observation only");
		expect(ACTOR_VOICE_RULES).toContain("Never undercut a moment of vulnerability");
	});

	it("includes safety guardrails", () => {
		expect(ACTOR_VOICE_RULES).toContain("never use diagnostic language");
		expect(ACTOR_VOICE_RULES).toContain("never characterize third parties");
		expect(ACTOR_VOICE_RULES).toContain("never give advice");
	});

	it("includes marine biology accuracy rule", () => {
		expect(ACTOR_VOICE_RULES).toContain("marine biology");
		expect(ACTOR_VOICE_RULES).toContain("biology must be real");
	});
});

describe("ACTOR_BRIEF_FRAMING", () => {
	it("instructs Actor to transform the brief", () => {
		expect(ACTOR_BRIEF_FRAMING).toContain("brief from your creative director");
		expect(ACTOR_BRIEF_FRAMING).toContain("Transform the direction into your words");
	});

	it("instructs Actor never to repeat the brief directly", () => {
		expect(ACTOR_BRIEF_FRAMING).toContain("Never repeat the brief's language directly");
	});
});

describe("buildActorPrompt", () => {
	it("composes NERIN_PERSONA + ACTOR_VOICE_RULES + ACTOR_BRIEF_FRAMING", () => {
		const prompt = buildActorPrompt();
		expect(prompt).toContain(NERIN_PERSONA);
		expect(prompt).toContain(ACTOR_VOICE_RULES);
		expect(prompt).toContain(ACTOR_BRIEF_FRAMING);
	});

	it("places sections in correct order", () => {
		const prompt = buildActorPrompt();
		const personaIdx = prompt.indexOf(NERIN_PERSONA);
		const voiceIdx = prompt.indexOf(ACTOR_VOICE_RULES);
		const framingIdx = prompt.indexOf(ACTOR_BRIEF_FRAMING);
		expect(personaIdx).toBeLessThan(voiceIdx);
		expect(voiceIdx).toBeLessThan(framingIdx);
	});

	it("does not contain assessment/facet/domain/strategy references", () => {
		const prompt = buildActorPrompt();
		expect(prompt).not.toContain("assessment");
		expect(prompt).not.toContain("facet");
		expect(prompt).not.toContain("domain");
		expect(prompt).not.toContain("territory");
		expect(prompt).not.toContain("steering");
	});

	it("returns a string of reasonable size (~650-1100 estimated tokens)", () => {
		const prompt = buildActorPrompt();
		// Rough token estimate: ~4 chars per token
		const estimatedTokens = prompt.length / 4;
		expect(estimatedTokens).toBeLessThan(1100);
		expect(estimatedTokens).toBeGreaterThan(200);
	});
});
