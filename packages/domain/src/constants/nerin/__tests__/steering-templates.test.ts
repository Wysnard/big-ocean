/**
 * Steering Templates Tests — Story 28-3
 *
 * Verifies the 9 intent x observation templates and the renderSteeringTemplate
 * function that selects and renders templates based on intent + observation focus.
 */

import { describe, expect, it } from "vitest";

import type { LifeDomain } from "../../life-domain";
import type {
	ContradictionTarget,
	ConvergenceTarget,
	DomainScore,
	ObservationFocus,
} from "../../../types/pacing";
import {
	AMPLIFY_CONTRADICTION_TEMPLATE,
	AMPLIFY_CONVERGENCE_TEMPLATE,
	AMPLIFY_NOTICING_TEMPLATE,
	AMPLIFY_RELATE_TEMPLATE,
	EXPLORE_CONTRADICTION_TEMPLATE,
	EXPLORE_CONVERGENCE_TEMPLATE,
	EXPLORE_NOTICING_TEMPLATE,
	EXPLORE_RELATE_TEMPLATE,
	OPEN_RELATE_TEMPLATE,
	STEERING_PREFIX,
	renderSteeringTemplate,
	renderTemplate,
} from "../steering-templates";

// ─── Helpers ────────────────────────────────────────────────────────

const sampleTerritory = {
	name: "Daily Routines",
	description: "how they structure their time and what they protect in it",
};

const makeDomainScore = (domain: string, score = 0.7, confidence = 0.8): DomainScore => ({
	domain: domain as LifeDomain,
	score,
	confidence,
});

const makeContradictionTarget = (): ContradictionTarget => ({
	facet: "trust" as never,
	pair: [makeDomainScore("work", 0.8, 0.7), makeDomainScore("relationships", 0.3, 0.6)],
	strength: 0.5,
});

const makeConvergenceTarget = (): ConvergenceTarget => ({
	facet: "altruism" as never,
	domains: [
		makeDomainScore("work"),
		makeDomainScore("relationships", 0.72, 0.7),
		makeDomainScore("family", 0.68, 0.6),
	],
	strength: 0.6,
});

// ─── Template Constants ─────────────────────────────────────────────

describe("template constants", () => {
	it("all 9 templates are non-empty strings", () => {
		const templates = [
			OPEN_RELATE_TEMPLATE,
			EXPLORE_RELATE_TEMPLATE,
			EXPLORE_NOTICING_TEMPLATE,
			EXPLORE_CONTRADICTION_TEMPLATE,
			EXPLORE_CONVERGENCE_TEMPLATE,
			AMPLIFY_RELATE_TEMPLATE,
			AMPLIFY_NOTICING_TEMPLATE,
			AMPLIFY_CONTRADICTION_TEMPLATE,
			AMPLIFY_CONVERGENCE_TEMPLATE,
		];
		for (const t of templates) {
			expect(typeof t).toBe("string");
			expect(t.length).toBeGreaterThan(0);
		}
	});

	it("OPEN_RELATE_TEMPLATE has territory parameter slots", () => {
		expect(OPEN_RELATE_TEMPLATE).toContain("{territory.name}");
		expect(OPEN_RELATE_TEMPLATE).toContain("{territory.description}");
	});

	it("EXPLORE templates have correct parameter slots per observation", () => {
		// relate: territory only
		expect(EXPLORE_RELATE_TEMPLATE).toContain("{territory.name}");
		expect(EXPLORE_RELATE_TEMPLATE).toContain("{territory.description}");

		// noticing: domain + territory
		expect(EXPLORE_NOTICING_TEMPLATE).toContain("{domain}");
		expect(EXPLORE_NOTICING_TEMPLATE).toContain("{territory.description}");

		// contradiction: facet, domain1, domain2 + territory
		expect(EXPLORE_CONTRADICTION_TEMPLATE).toContain("{facet}");
		expect(EXPLORE_CONTRADICTION_TEMPLATE).toContain("{domain1}");
		expect(EXPLORE_CONTRADICTION_TEMPLATE).toContain("{domain2}");
		expect(EXPLORE_CONTRADICTION_TEMPLATE).toContain("{territory.description}");

		// convergence: facet, domains + territory
		expect(EXPLORE_CONVERGENCE_TEMPLATE).toContain("{facet}");
		expect(EXPLORE_CONVERGENCE_TEMPLATE).toContain("{domains}");
		expect(EXPLORE_CONVERGENCE_TEMPLATE).toContain("{territory.description}");
	});

	it("AMPLIFY templates have correct parameter slots per observation", () => {
		// relate: no parameter slots needed
		expect(AMPLIFY_RELATE_TEMPLATE).not.toContain("{territory");
		expect(AMPLIFY_RELATE_TEMPLATE).not.toContain("{facet}");

		// noticing: domain only
		expect(AMPLIFY_NOTICING_TEMPLATE).toContain("{domain}");
		expect(AMPLIFY_NOTICING_TEMPLATE).not.toContain("{territory");

		// contradiction: facet, domain1, domain2
		expect(AMPLIFY_CONTRADICTION_TEMPLATE).toContain("{facet}");
		expect(AMPLIFY_CONTRADICTION_TEMPLATE).toContain("{domain1}");
		expect(AMPLIFY_CONTRADICTION_TEMPLATE).toContain("{domain2}");

		// convergence: facet, domains
		expect(AMPLIFY_CONVERGENCE_TEMPLATE).toContain("{facet}");
		expect(AMPLIFY_CONVERGENCE_TEMPLATE).toContain("{domains}");
	});
});

// ─── Steering Prefix ────────────────────────────────────────────────

describe("STEERING_PREFIX", () => {
	it("is the correct string", () => {
		expect(STEERING_PREFIX).toBe("What's caught your attention this turn:");
	});
});

// ─── renderTemplate ─────────────────────────────────────────────────

describe("renderTemplate", () => {
	it("replaces single parameter", () => {
		const result = renderTemplate("Hello {name}!", { name: "Nerin" });
		expect(result).toBe("Hello Nerin!");
	});

	it("replaces multiple parameters", () => {
		const result = renderTemplate("{a} and {b}", { a: "one", b: "two" });
		expect(result).toBe("one and two");
	});

	it("replaces dotted parameter keys", () => {
		const result = renderTemplate("{territory.name} — {territory.description}", {
			"territory.name": "Daily Routines",
			"territory.description": "how they structure their time",
		});
		expect(result).toBe("Daily Routines — how they structure their time");
	});

	it("leaves unmatched placeholders intact", () => {
		const result = renderTemplate("{known} and {unknown}", { known: "yes" });
		expect(result).toBe("yes and {unknown}");
	});
});

// ─── renderSteeringTemplate ─────────────────────────────────────────

describe("renderSteeringTemplate", () => {
	describe("open intent", () => {
		it("renders open x relate with territory params", () => {
			const focus: ObservationFocus = { type: "relate" };
			const result = renderSteeringTemplate("open", focus, sampleTerritory);
			expect(result).toContain("Daily Routines");
			expect(result).toContain("how they structure their time");
			expect(result).not.toMatch(/\{[^}]+\}/); // no unresolved placeholders
		});
	});

	describe("explore intent", () => {
		it("renders explore x relate with territory params", () => {
			const focus: ObservationFocus = { type: "relate" };
			const result = renderSteeringTemplate("explore", focus, sampleTerritory);
			expect(result).toContain("Daily Routines");
			expect(result).toContain("how they structure their time");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders explore x noticing with domain param", () => {
			const focus: ObservationFocus = { type: "noticing", domain: "work" as LifeDomain };
			const result = renderSteeringTemplate("explore", focus, sampleTerritory);
			expect(result).toContain("work");
			expect(result).toContain("how they structure their time");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders explore x contradiction with facet and domain params", () => {
			const focus: ObservationFocus = { type: "contradiction", target: makeContradictionTarget() };
			const result = renderSteeringTemplate("explore", focus, sampleTerritory);
			expect(result).toContain("trust");
			expect(result).toContain("work");
			expect(result).toContain("relationships");
			expect(result).toContain("how they structure their time");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders explore x convergence with facet and domains params", () => {
			const focus: ObservationFocus = { type: "convergence", target: makeConvergenceTarget() };
			const result = renderSteeringTemplate("explore", focus, sampleTerritory);
			expect(result).toContain("altruism");
			expect(result).toContain("work");
			expect(result).toContain("relationships");
			expect(result).toContain("family");
			expect(result).toContain("how they structure their time");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});
	});

	describe("amplify intent", () => {
		it("renders amplify x relate (no territory params needed)", () => {
			const focus: ObservationFocus = { type: "relate" };
			const result = renderSteeringTemplate("amplify", focus, sampleTerritory);
			expect(result).toContain("last question");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders amplify x noticing with domain param", () => {
			const focus: ObservationFocus = { type: "noticing", domain: "leisure" as LifeDomain };
			const result = renderSteeringTemplate("amplify", focus, sampleTerritory);
			expect(result).toContain("leisure");
			expect(result).toContain("last question");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders amplify x contradiction with facet and domain params", () => {
			const focus: ObservationFocus = { type: "contradiction", target: makeContradictionTarget() };
			const result = renderSteeringTemplate("amplify", focus, sampleTerritory);
			expect(result).toContain("trust");
			expect(result).toContain("work");
			expect(result).toContain("relationships");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders amplify x convergence with facet and domains params", () => {
			const focus: ObservationFocus = { type: "convergence", target: makeConvergenceTarget() };
			const result = renderSteeringTemplate("amplify", focus, sampleTerritory);
			expect(result).toContain("altruism");
			expect(result).toContain("work, relationships, family");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});
	});
});
