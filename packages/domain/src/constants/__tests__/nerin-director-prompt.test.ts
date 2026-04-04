import { describe, expect, it } from "vitest";
import type { DomainMessage } from "../../types/message";
import type { CoverageTargetWithDefinitions } from "../../utils/coverage-analyzer";
import { NERIN_DIRECTOR_CLOSING_PROMPT } from "../nerin-director-closing-prompt";
import { buildDirectorUserMessage, NERIN_DIRECTOR_PROMPT } from "../nerin-director-prompt";

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
		expect(NERIN_DIRECTOR_PROMPT).toContain("Observation beat");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Connection beat");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Question beat");
	});

	it("contains 3 surviving instincts", () => {
		// story-over-abstraction
		expect(NERIN_DIRECTOR_PROMPT).toContain("concrete stories and specific moments");
		// pushback-two-strikes
		expect(NERIN_DIRECTOR_PROMPT).toContain("pushes back");
		expect(NERIN_DIRECTOR_PROMPT).toContain("reject again");
		// don't-fully-reveal
		expect(NERIN_DIRECTOR_PROMPT).toContain("Keep observations partial");
	});

	it("contains anti-patterns", () => {
		expect(NERIN_DIRECTOR_PROMPT).toContain("Never write dialogue");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Never suggest specific phrases");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Describe the beat, not the line");
	});

	it("contains the critical user word requirement", () => {
		expect(NERIN_DIRECTOR_PROMPT).toContain("Quote or paraphrase the user's specific words");
	});

	it("contains domain/facet steering guidance", () => {
		expect(NERIN_DIRECTOR_PROMPT).toContain("Domains are where the conversation goes");
		expect(NERIN_DIRECTOR_PROMPT).toContain("Facets are what you're listening for");
	});
});

describe("NERIN_DIRECTOR_CLOSING_PROMPT", () => {
	it("is a non-empty string", () => {
		expect(typeof NERIN_DIRECTOR_CLOSING_PROMPT).toBe("string");
		expect(NERIN_DIRECTOR_CLOSING_PROMPT.length).toBeGreaterThan(0);
	});

	it("extends the base Director prompt", () => {
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain(NERIN_DIRECTOR_PROMPT);
	});

	it("contains closing-specific instructions", () => {
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("final exchange");
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("boldest observation");
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("core tension or pattern");
	});

	it("mandates the observation beat", () => {
		expect(NERIN_DIRECTOR_CLOSING_PROMPT).toContain("observation beat is mandatory");
	});
});

describe("buildDirectorUserMessage", () => {
	const sampleTargets: CoverageTargetWithDefinitions = {
		targetFacets: [
			{ facet: "imagination", definition: "Rich fantasy life, openness to new experiences" },
			{ facet: "intellect", definition: "Intellectual curiosity, love of ideas" },
			{ facet: "emotionality", definition: "Emotional awareness and sensitivity" },
		],
		targetDomain: {
			domain: "leisure",
			definition: "Hobbies, recreation, alone-time activities, introspection",
		},
	};

	const sampleMessages: DomainMessage[] = [
		{ id: "1", role: "assistant", content: "Hey there! What brings you to Big Ocean?" },
		{ id: "2", role: "user", content: "I wanted to understand myself better." },
		{ id: "3", role: "assistant", content: "That's a great reason. Tell me about your week." },
		{ id: "4", role: "user", content: "It was intense. I had a big presentation at work." },
	];

	it("includes the target domain name and definition", () => {
		const result = buildDirectorUserMessage(sampleTargets, sampleMessages);
		expect(result).toContain("TARGET DOMAIN: leisure");
		expect(result).toContain("Hobbies, recreation, alone-time activities, introspection");
	});

	it("includes all target facets with definitions", () => {
		const result = buildDirectorUserMessage(sampleTargets, sampleMessages);
		expect(result).toContain("imagination: Rich fantasy life");
		expect(result).toContain("intellect: Intellectual curiosity");
		expect(result).toContain("emotionality: Emotional awareness");
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
		expect(result).toContain("Write your brief for Nerin's next response.");
	});
});
