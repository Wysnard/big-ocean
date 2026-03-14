/**
 * Steering Templates Tests — Stories 28-3, 29-2
 *
 * Verifies the 13 intent x observation templates and the renderSteeringTemplate
 * function that selects and renders templates based on intent + observation focus.
 *
 * Story 29-2: Adds 4 bridge x observation templates and BRIDGE_NEGATIVE_CONSTRAINT.
 */

import { describe, expect, it } from "vitest";
import type {
	ContradictionTarget,
	ConvergenceTarget,
	DomainScore,
	ObservationFocus,
} from "../../../types/pacing";
import type { LifeDomain } from "../../life-domain";
import {
	CLOSE_CONTRADICTION_TEMPLATE,
	CLOSE_CONVERGENCE_TEMPLATE,
	CLOSE_NOTICING_TEMPLATE,
	CLOSE_RELATE_TEMPLATE,
	BRIDGE_CONTRADICTION_TEMPLATE,
	BRIDGE_CONVERGENCE_TEMPLATE,
	BRIDGE_NEGATIVE_CONSTRAINT,
	BRIDGE_NOTICING_TEMPLATE,
	BRIDGE_RELATE_TEMPLATE,
	EXPLORE_CONTRADICTION_TEMPLATE,
	EXPLORE_CONVERGENCE_TEMPLATE,
	EXPLORE_NOTICING_TEMPLATE,
	EXPLORE_RELATE_TEMPLATE,
	OPEN_RELATE_TEMPLATE,
	renderSteeringTemplate,
	renderTemplate,
	STEERING_PREFIX,
	TEMPLATE_COUNT,
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
	it("all 13 templates are non-empty strings", () => {
		const templates = [
			OPEN_RELATE_TEMPLATE,
			EXPLORE_RELATE_TEMPLATE,
			EXPLORE_NOTICING_TEMPLATE,
			EXPLORE_CONTRADICTION_TEMPLATE,
			EXPLORE_CONVERGENCE_TEMPLATE,
			BRIDGE_RELATE_TEMPLATE,
			BRIDGE_NOTICING_TEMPLATE,
			BRIDGE_CONTRADICTION_TEMPLATE,
			BRIDGE_CONVERGENCE_TEMPLATE,
			CLOSE_RELATE_TEMPLATE,
			CLOSE_NOTICING_TEMPLATE,
			CLOSE_CONTRADICTION_TEMPLATE,
			CLOSE_CONVERGENCE_TEMPLATE,
		];
		for (const t of templates) {
			expect(typeof t).toBe("string");
			expect(t.length).toBeGreaterThan(0);
		}
	});

	it("TEMPLATE_COUNT is 13", () => {
		expect(TEMPLATE_COUNT).toBe(13);
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

	it("BRIDGE templates have correct parameter slots", () => {
		// All bridge templates reference previousTerritory.name and newTerritory.name/description
		for (const tmpl of [
			BRIDGE_RELATE_TEMPLATE,
			BRIDGE_NOTICING_TEMPLATE,
			BRIDGE_CONTRADICTION_TEMPLATE,
			BRIDGE_CONVERGENCE_TEMPLATE,
		]) {
			expect(tmpl).toContain("{previousTerritory.name}");
			expect(tmpl).toContain("{newTerritory.description}");
		}

		// bridge x relate: 3-tier fallback structure
		expect(BRIDGE_RELATE_TEMPLATE).toContain("come back to it");
		expect(BRIDGE_RELATE_TEMPLATE).toContain("good read");

		// bridge x noticing: domain param
		expect(BRIDGE_NOTICING_TEMPLATE).toContain("{domain}");

		// bridge x contradiction: facet, domain1, domain2
		expect(BRIDGE_CONTRADICTION_TEMPLATE).toContain("{facet}");
		expect(BRIDGE_CONTRADICTION_TEMPLATE).toContain("{domain1}");
		expect(BRIDGE_CONTRADICTION_TEMPLATE).toContain("{domain2}");

		// bridge x convergence: facet, domains
		expect(BRIDGE_CONVERGENCE_TEMPLATE).toContain("{facet}");
		expect(BRIDGE_CONVERGENCE_TEMPLATE).toContain("{domains}");
	});

	it("BRIDGE_NEGATIVE_CONSTRAINT has previousTerritory.name slot", () => {
		expect(BRIDGE_NEGATIVE_CONSTRAINT).toContain("{previousTerritory.name}");
		expect(BRIDGE_NEGATIVE_CONSTRAINT).toContain("Don't pull the conversation back");
	});

	it("CLOSE templates have correct parameter slots per observation", () => {
		// relate: no parameter slots needed
		expect(CLOSE_RELATE_TEMPLATE).not.toContain("{territory");
		expect(CLOSE_RELATE_TEMPLATE).not.toContain("{facet}");

		// noticing: domain only
		expect(CLOSE_NOTICING_TEMPLATE).toContain("{domain}");
		expect(CLOSE_NOTICING_TEMPLATE).not.toContain("{territory");

		// contradiction: facet, domain1, domain2
		expect(CLOSE_CONTRADICTION_TEMPLATE).toContain("{facet}");
		expect(CLOSE_CONTRADICTION_TEMPLATE).toContain("{domain1}");
		expect(CLOSE_CONTRADICTION_TEMPLATE).toContain("{domain2}");

		// convergence: facet, domains
		expect(CLOSE_CONVERGENCE_TEMPLATE).toContain("{facet}");
		expect(CLOSE_CONVERGENCE_TEMPLATE).toContain("{domains}");
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

	describe("bridge intent", () => {
		const previousTerritory = {
			name: "Creative Pursuits",
			description: "what they make or imagine when nobody's watching",
		};
		const newTerritory = sampleTerritory;

		it("renders bridge x relate with both territory params and 3-tier fallback content", () => {
			const focus: ObservationFocus = { type: "relate" };
			const result = renderSteeringTemplate("bridge", focus, newTerritory, previousTerritory);
			expect(result).toContain("Creative Pursuits"); // previousTerritory.name
			expect(result).toContain("how they structure their time"); // newTerritory.description
			expect(result).toContain("come back to it"); // flag and leave
			expect(result).toContain("good read"); // clean jump
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders bridge x noticing with domain + both territory params", () => {
			const focus: ObservationFocus = { type: "noticing", domain: "work" as LifeDomain };
			const result = renderSteeringTemplate("bridge", focus, newTerritory, previousTerritory);
			expect(result).toContain("work");
			expect(result).toContain("Creative Pursuits");
			expect(result).toContain("how they structure their time");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders bridge x contradiction with facet, domains + both territory params", () => {
			const focus: ObservationFocus = { type: "contradiction", target: makeContradictionTarget() };
			const result = renderSteeringTemplate("bridge", focus, newTerritory, previousTerritory);
			expect(result).toContain("trust");
			expect(result).toContain("work");
			expect(result).toContain("relationships");
			expect(result).toContain("Creative Pursuits");
			expect(result).toContain("how they structure their time");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders bridge x convergence with facet, domains + both territory params", () => {
			const focus: ObservationFocus = { type: "convergence", target: makeConvergenceTarget() };
			const result = renderSteeringTemplate("bridge", focus, newTerritory, previousTerritory);
			expect(result).toContain("altruism");
			expect(result).toContain("work");
			expect(result).toContain("Creative Pursuits");
			expect(result).toContain("how they structure their time");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("throws when bridge intent is called without previousTerritory", () => {
			const focus: ObservationFocus = { type: "relate" };
			expect(() => renderSteeringTemplate("bridge", focus, newTerritory)).toThrow(
				/bridge.*previousTerritory/i,
			);
		});
	});

	describe("close intent", () => {
		it("renders close x relate (no territory params needed)", () => {
			const focus: ObservationFocus = { type: "relate" };
			const result = renderSteeringTemplate("close", focus, sampleTerritory);
			expect(result).toContain("last question");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders close x noticing with domain param", () => {
			const focus: ObservationFocus = { type: "noticing", domain: "leisure" as LifeDomain };
			const result = renderSteeringTemplate("close", focus, sampleTerritory);
			expect(result).toContain("leisure");
			expect(result).toContain("last question");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders close x contradiction with facet and domain params", () => {
			const focus: ObservationFocus = { type: "contradiction", target: makeContradictionTarget() };
			const result = renderSteeringTemplate("close", focus, sampleTerritory);
			expect(result).toContain("trust");
			expect(result).toContain("work");
			expect(result).toContain("relationships");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});

		it("renders close x convergence with facet and domains params", () => {
			const focus: ObservationFocus = { type: "convergence", target: makeConvergenceTarget() };
			const result = renderSteeringTemplate("close", focus, sampleTerritory);
			expect(result).toContain("altruism");
			expect(result).toContain("work, relationships, family");
			expect(result).not.toMatch(/\{[^}]+\}/);
		});
	});
});
