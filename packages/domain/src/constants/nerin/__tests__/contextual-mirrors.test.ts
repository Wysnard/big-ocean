/**
 * Contextual Mirror System Tests — Story 29-3
 *
 * Verifies that mirrors are loaded contextually by intent x observation
 * rather than as monolithic modules (MIRRORS_EXPLORE / MIRRORS_AMPLIFY).
 */

import { describe, expect, it } from "vitest";

import { getMirrorsForContext } from "../contextual-mirrors";

// ─── All 13 Mirror Names ────────────────────────────────────────────

const ALL_MIRRORS = [
	"Hermit Crab",
	"Ghost Net",
	"Pilot Fish",
	"Tide Pool",
	"Mimic Octopus",
	"Clownfish",
	"Dolphin Echolocation",
	"Bioluminescence",
	"Parrotfish",
	"Sea Urchin",
	"Coral Reef",
	"Volcanic Vents",
	"Mola Mola",
] as const;

const GUARDRAIL_TEXT = "You can discover new mirrors in the moment — but the biology must be real";

// ─── Open Intent — No Mirrors ───────────────────────────────────────

describe("open intent — no mirrors", () => {
	it("returns null for open x relate", () => {
		expect(getMirrorsForContext("open", "relate")).toBeNull();
	});

	it("returns null for open x noticing", () => {
		expect(getMirrorsForContext("open", "noticing")).toBeNull();
	});

	it("returns null for open x contradiction", () => {
		expect(getMirrorsForContext("open", "contradiction")).toBeNull();
	});

	it("returns null for open x convergence", () => {
		expect(getMirrorsForContext("open", "convergence")).toBeNull();
	});
});

// ─── Explore Intent — Observation-Specific Mirrors ──────────────────

describe("explore intent — observation-specific mirrors", () => {
	it("explore x relate includes all 13 mirrors", () => {
		const result = getMirrorsForContext("explore", "relate");
		expect(result).not.toBeNull();
		for (const mirror of ALL_MIRRORS) {
			expect(result).toContain(mirror);
		}
	});

	it("explore x noticing includes exactly Hermit Crab, Volcanic Vents, Bioluminescence, Tide Pool", () => {
		const result = getMirrorsForContext("explore", "noticing");
		expect(result).not.toBeNull();
		expect(result).toContain("Hermit Crab");
		expect(result).toContain("Volcanic Vents");
		expect(result).toContain("Bioluminescence");
		expect(result).toContain("Tide Pool");
		// Should NOT include others
		expect(result).not.toContain("Ghost Net");
		expect(result).not.toContain("Pilot Fish");
		expect(result).not.toContain("Mimic Octopus");
		expect(result).not.toContain("Clownfish");
		expect(result).not.toContain("Dolphin Echolocation");
		expect(result).not.toContain("Parrotfish");
		expect(result).not.toContain("Sea Urchin");
		expect(result).not.toContain("Coral Reef");
		expect(result).not.toContain("Mola Mola");
	});

	it("explore x contradiction includes exactly Tide Pool, Bioluminescence, Dolphin Echolocation, Mimic Octopus", () => {
		const result = getMirrorsForContext("explore", "contradiction");
		expect(result).not.toBeNull();
		expect(result).toContain("Tide Pool");
		expect(result).toContain("Bioluminescence");
		expect(result).toContain("Dolphin Echolocation");
		expect(result).toContain("Mimic Octopus");
		// Should NOT include others
		expect(result).not.toContain("Hermit Crab");
		expect(result).not.toContain("Ghost Net");
		expect(result).not.toContain("Pilot Fish");
		expect(result).not.toContain("Clownfish");
		expect(result).not.toContain("Parrotfish");
		expect(result).not.toContain("Sea Urchin");
		expect(result).not.toContain("Coral Reef");
		expect(result).not.toContain("Volcanic Vents");
		expect(result).not.toContain("Mola Mola");
	});

	it("explore x convergence includes exactly Ghost Net, Pilot Fish, Coral Reef, Parrotfish, Sea Urchin", () => {
		const result = getMirrorsForContext("explore", "convergence");
		expect(result).not.toBeNull();
		expect(result).toContain("Ghost Net");
		expect(result).toContain("Pilot Fish");
		expect(result).toContain("Coral Reef");
		expect(result).toContain("Parrotfish");
		expect(result).toContain("Sea Urchin");
		// Should NOT include others
		expect(result).not.toContain("Hermit Crab");
		expect(result).not.toContain("Tide Pool");
		expect(result).not.toContain("Mimic Octopus");
		expect(result).not.toContain("Clownfish");
		expect(result).not.toContain("Dolphin Echolocation");
		expect(result).not.toContain("Bioluminescence");
		expect(result).not.toContain("Volcanic Vents");
		expect(result).not.toContain("Mola Mola");
	});
});

// ─── Bridge Intent — Subset of Explore Mirrors ─────────────────────

describe("bridge intent — subset of explore mirrors", () => {
	it("bridge x relate includes all 13 mirrors", () => {
		const result = getMirrorsForContext("bridge", "relate");
		expect(result).not.toBeNull();
		for (const mirror of ALL_MIRRORS) {
			expect(result).toContain(mirror);
		}
	});

	it("bridge x noticing includes exactly Hermit Crab, Volcanic Vents", () => {
		const result = getMirrorsForContext("bridge", "noticing");
		expect(result).not.toBeNull();
		expect(result).toContain("Hermit Crab");
		expect(result).toContain("Volcanic Vents");
		// Should NOT include others
		expect(result).not.toContain("Ghost Net");
		expect(result).not.toContain("Pilot Fish");
		expect(result).not.toContain("Tide Pool");
		expect(result).not.toContain("Mimic Octopus");
		expect(result).not.toContain("Clownfish");
		expect(result).not.toContain("Dolphin Echolocation");
		expect(result).not.toContain("Bioluminescence");
		expect(result).not.toContain("Parrotfish");
		expect(result).not.toContain("Sea Urchin");
		expect(result).not.toContain("Coral Reef");
		expect(result).not.toContain("Mola Mola");
	});

	it("bridge x contradiction includes exactly Tide Pool, Dolphin Echolocation", () => {
		const result = getMirrorsForContext("bridge", "contradiction");
		expect(result).not.toBeNull();
		expect(result).toContain("Tide Pool");
		expect(result).toContain("Dolphin Echolocation");
		// Should NOT include others
		expect(result).not.toContain("Hermit Crab");
		expect(result).not.toContain("Ghost Net");
		expect(result).not.toContain("Pilot Fish");
		expect(result).not.toContain("Mimic Octopus");
		expect(result).not.toContain("Clownfish");
		expect(result).not.toContain("Bioluminescence");
		expect(result).not.toContain("Parrotfish");
		expect(result).not.toContain("Sea Urchin");
		expect(result).not.toContain("Coral Reef");
		expect(result).not.toContain("Volcanic Vents");
		expect(result).not.toContain("Mola Mola");
	});

	it("bridge x convergence includes exactly Ghost Net, Coral Reef, Pilot Fish", () => {
		const result = getMirrorsForContext("bridge", "convergence");
		expect(result).not.toBeNull();
		expect(result).toContain("Ghost Net");
		expect(result).toContain("Coral Reef");
		expect(result).toContain("Pilot Fish");
		// Should NOT include others
		expect(result).not.toContain("Hermit Crab");
		expect(result).not.toContain("Tide Pool");
		expect(result).not.toContain("Mimic Octopus");
		expect(result).not.toContain("Clownfish");
		expect(result).not.toContain("Dolphin Echolocation");
		expect(result).not.toContain("Bioluminescence");
		expect(result).not.toContain("Parrotfish");
		expect(result).not.toContain("Sea Urchin");
		expect(result).not.toContain("Volcanic Vents");
		expect(result).not.toContain("Mola Mola");
	});
});

// ─── Close Intent — Same Set for All Observations ───────────────────

describe("close intent — same set for all observations", () => {
	const CLOSE_MIRRORS = ["Ghost Net", "Mimic Octopus", "Volcanic Vents", "Mola Mola"];

	it("close x relate includes exactly Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola", () => {
		const result = getMirrorsForContext("close", "relate");
		expect(result).not.toBeNull();
		for (const mirror of CLOSE_MIRRORS) {
			expect(result).toContain(mirror);
		}
		// Should NOT include non-close mirrors
		expect(result).not.toContain("Hermit Crab");
		expect(result).not.toContain("Pilot Fish");
		expect(result).not.toContain("Clownfish");
		expect(result).not.toContain("Dolphin Echolocation");
		expect(result).not.toContain("Bioluminescence");
		expect(result).not.toContain("Parrotfish");
		expect(result).not.toContain("Sea Urchin");
		expect(result).not.toContain("Tide Pool");
	});

	it("close x noticing returns same set as close x relate", () => {
		const relate = getMirrorsForContext("close", "relate");
		const noticing = getMirrorsForContext("close", "noticing");
		expect(noticing).toBe(relate);
	});

	it("close x contradiction returns same set as close x relate", () => {
		const relate = getMirrorsForContext("close", "relate");
		const contradiction = getMirrorsForContext("close", "contradiction");
		expect(contradiction).toBe(relate);
	});

	it("close x convergence returns same set as close x relate", () => {
		const relate = getMirrorsForContext("close", "relate");
		const convergence = getMirrorsForContext("close", "convergence");
		expect(convergence).toBe(relate);
	});
});

// ─── Guardrail Inclusion ────────────────────────────────────────────

describe("guardrail inclusion", () => {
	it("all non-null results include the guardrail text", () => {
		const intents = ["explore", "bridge", "close"] as const;
		const observations = ["relate", "noticing", "contradiction", "convergence"] as const;

		for (const intent of intents) {
			for (const observation of observations) {
				const result = getMirrorsForContext(intent, observation);
				expect(result).toContain(GUARDRAIL_TEXT);
			}
		}
	});

	it("all non-null results include NATURAL WORLD MIRRORS header", () => {
		const result = getMirrorsForContext("explore", "relate");
		expect(result).toContain("NATURAL WORLD MIRRORS");
	});
});
