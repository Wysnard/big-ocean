import { describe, expect, it } from "vitest";
import type { DomainMessage } from "../../types/message";
import type { CoverageTargetWithDefinitions } from "../../utils/coverage-analyzer";
import { NERIN_DIRECTOR_CLOSING_PROMPT } from "../nerin-director-closing-prompt";
import {
	buildDirectorUserMessage,
	getDirectorPromptForPhase,
	NERIN_DIRECTOR_EXPLORING_PROMPT,
	NERIN_DIRECTOR_OPENING_PROMPT,
	NERIN_DIRECTOR_PROMPT,
} from "../nerin-director-prompt";

describe("NERIN_DIRECTOR_PROMPT", () => {
	it("is a non-empty string", () => {
		expect(typeof NERIN_DIRECTOR_PROMPT).toBe("string");
		expect(NERIN_DIRECTOR_PROMPT.length).toBeGreaterThan(0);
	});

	it("contains the Director role description", () => {
		expect(NERIN_DIRECTOR_PROMPT).toContain("creative director");
		expect(NERIN_DIRECTOR_PROMPT).toContain("voice actor");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Don't write the actor's lines");
	});

	it("contains three-signal quality bar", () => {
		expect(NERIN_DIRECTOR_PROMPT).toContain("Content direction");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Emotional shape");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Structural constraint");
	});

	it("contains three-beat brief structure", () => {
		expect(NERIN_DIRECTOR_PROMPT).toContain("Acknowledge beat");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Weave beat");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Question beat");
	});

	it("contains surviving instincts", () => {
		// scenario-over-abstraction
		expect(NERIN_DIRECTOR_PROMPT).toContain("Put the user inside a scenario");
		// don't-fully-reveal
		expect(NERIN_DIRECTOR_PROMPT).toContain("Keep observations partial");
	});

	it("contains anti-patterns", () => {
		expect(NERIN_DIRECTOR_PROMPT).toContain("Never write dialogue");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Never suggest specific phrases");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Describe the beat, not the line");
	});

	it("contains the critical user word requirement", () => {
		expect(NERIN_DIRECTOR_PROMPT).toContain("Quote the user's specific words");
	});

	it("contains steering guidance (opening phase)", () => {
		expect(NERIN_DIRECTOR_PROMPT).toContain("opening phase");
		expect(NERIN_DIRECTOR_PROMPT).toContain("rapport");
	});
});

describe("Phase-specific Director prompts", () => {
	it("all three phases share the base (creative director, beats, instincts)", () => {
		for (const prompt of [
			NERIN_DIRECTOR_OPENING_PROMPT,
			NERIN_DIRECTOR_EXPLORING_PROMPT,
			NERIN_DIRECTOR_CLOSING_PROMPT,
		]) {
			expect(prompt).toContain("creative director");
			expect(prompt).toContain("Acknowledge beat");
			expect(prompt).toContain("Weave beat");
			expect(prompt).toContain("Question beat");
			expect(prompt).toContain("Keep observations partial");
		}
	});

	it("opening prompt prioritizes rapport over coverage", () => {
		expect(NERIN_DIRECTOR_OPENING_PROMPT).toContain("Follow the thread");
		expect(NERIN_DIRECTOR_OPENING_PROMPT).toContain("soft suggestion");
	});

	it("exploring prompt enforces primary facet steering across candidate domains", () => {
		expect(NERIN_DIRECTOR_EXPLORING_PROMPT).toContain("hard target");
		expect(NERIN_DIRECTOR_EXPLORING_PROMPT).toContain(
			"MUST create a moment where the primary facet can surface",
		);
		expect(NERIN_DIRECTOR_EXPLORING_PROMPT).toContain("one of the candidate domains");
	});

	it("closing prompt demands boldest observation", () => {
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("boldest observation");
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("final exchange");
	});

	it("getDirectorPromptForPhase returns correct prompt per phase", () => {
		expect(getDirectorPromptForPhase("opening")).toBe(NERIN_DIRECTOR_OPENING_PROMPT);
		expect(getDirectorPromptForPhase("exploring")).toBe(NERIN_DIRECTOR_EXPLORING_PROMPT);
		expect(getDirectorPromptForPhase("closing")).toBe(NERIN_DIRECTOR_CLOSING_PROMPT);
	});
});

describe("NERIN_DIRECTOR_CLOSING_PROMPT", () => {
	it("is a non-empty string", () => {
		expect(typeof NERIN_DIRECTOR_CLOSING_PROMPT).toBe("string");
		expect(NERIN_DIRECTOR_CLOSING_PROMPT.length).toBeGreaterThan(0);
	});

	it("shares the base with other phase prompts", () => {
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("creative director");
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("Acknowledge beat");
	});

	it("contains closing-specific instructions", () => {
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("final exchange");
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("boldest observation");
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("core tension or pattern");
	});

	it("mandates the acknowledge beat", () => {
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("acknowledge beat is mandatory");
	});
});

describe("buildDirectorUserMessage", () => {
	const sampleTargets: CoverageTargetWithDefinitions = {
		primaryFacet: {
			facet: "imagination",
			definition: "Active imagination and rich inner scenario-building",
		},
		candidateDomains: [
			{
				domain: "leisure",
				definition: "Hobbies, recreation, alone-time activities, introspection",
			},
			{
				domain: "relationships",
				definition: "Romantic partners, close friendships, social connections",
			},
			{
				domain: "health",
				definition: "Exercise, diet, sleep, self-care routines, physical/mental wellness",
			},
		],
		phase: "exploring",
	};

	const sampleMessages: DomainMessage[] = [
		{ id: "1", role: "assistant", content: "Hey there! What brings you to Big Ocean?" },
		{ id: "2", role: "user", content: "I wanted to understand myself better." },
		{ id: "3", role: "assistant", content: "That's a great reason. Tell me about your week." },
		{ id: "4", role: "user", content: "It was intense. I had a big presentation at work." },
	];

	it("includes candidate domain names and definitions", () => {
		const result = buildDirectorUserMessage(sampleTargets, sampleMessages);
		expect(result).toContain("CANDIDATE DOMAINS");
		expect(result).toContain("leisure");
		expect(result).toContain("Hobbies, recreation, alone-time activities, introspection");
		expect(result).toContain("relationships");
	});

	it("includes the primary facet with definition", () => {
		const result = buildDirectorUserMessage(sampleTargets, sampleMessages);
		expect(result).toContain("PRIMARY FACET");
		expect(result).toContain("imagination: Active imagination and rich inner scenario-building");
	});

	it("includes conversation history in [role]: content format", () => {
		const result = buildDirectorUserMessage(sampleTargets, sampleMessages);
		expect(result).toContain("[assistant]: Hey there! What brings you to Big Ocean?");
		expect(result).toContain("[user]: I wanted to understand myself better.");
		expect(result).toContain("[user]: It was intense. I had a big presentation at work.");
	});

	it("handles empty messages (first turn)", () => {
		const result = buildDirectorUserMessage(sampleTargets, []);
		expect(result).toContain("No messages yet");
		expect(result).toContain("first turn after the greeting");
	});

	it("ends with the brief instruction", () => {
		const result = buildDirectorUserMessage(sampleTargets, sampleMessages);
		expect(result).toContain("must land in ONE of the candidate domains");
		expect(result).toContain("Write your brief for Nerin's next response.");
	});
});
