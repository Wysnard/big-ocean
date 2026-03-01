import { describe, expect, it } from "vitest";
import type { FacetName } from "../../../constants/big-five";
import type { LifeDomain } from "../../../constants/life-domain";
import { type IntentType, type RealizeMicroIntentInput, realizeMicroIntent } from "../realize-micro-intent";

const baseInput: RealizeMicroIntentInput = {
	targetFacet: "achievement_striving" as FacetName,
	targetDomain: "work" as LifeDomain,
	previousDomain: "work" as LifeDomain,
	domainStreak: 1,
	turnIndex: 10,
	nearingEnd: false,
	recentIntentTypes: [],
};

function input(overrides: Partial<RealizeMicroIntentInput>): RealizeMicroIntentInput {
	return { ...baseInput, ...overrides };
}

describe("realizeMicroIntent", () => {
	it("returns domain_shift when targetDomain !== previousDomain", () => {
		const result = realizeMicroIntent(input({ targetDomain: "leisure", previousDomain: "work" }));
		expect(result.intent).toBe("domain_shift");
		expect(result.domain).toBe("leisure");
		expect(result.bridgeHint).toBeDefined();
	});

	it("returns depth_push when domainStreak >= 3", () => {
		const result = realizeMicroIntent(input({ domainStreak: 3 }));
		expect(result.intent).toBe("depth_push");
	});

	it("returns story_pull for early turns (turnIndex < 6)", () => {
		const result = realizeMicroIntent(input({ turnIndex: 3, domainStreak: 0, previousDomain: null }));
		expect(result.intent).toBe("story_pull");
	});

	it("avoids 3rd consecutive tradeoff_probe", () => {
		// turnIndex=9 → 9 % 3 = 0 → tradeoff_probe would be selected
		const result = realizeMicroIntent(
			input({
				turnIndex: 9,
				recentIntentTypes: ["tradeoff_probe", "tradeoff_probe"],
			}),
		);
		expect(result.intent).not.toBe("tradeoff_probe");
		expect(result.intent).toBe("story_pull");
	});

	it("allows 2 consecutive tradeoff_probes", () => {
		// turnIndex=9 → 9 % 3 = 0 → tradeoff_probe selected, only 1 recent probe
		const result = realizeMicroIntent(
			input({
				turnIndex: 9,
				recentIntentTypes: ["story_pull", "tradeoff_probe"],
			}),
		);
		expect(result.intent).toBe("tradeoff_probe");
	});

	it("returns depth_push when nearingEnd", () => {
		const result = realizeMicroIntent(input({ nearingEnd: true }));
		expect(result.intent).toBe("depth_push");
	});

	it("includes bridgeHint on domain shifts", () => {
		const result = realizeMicroIntent(
			input({ targetDomain: "family", previousDomain: "work" }),
		);
		expect(result.bridgeHint).toBeDefined();
		expect(["map_same_theme", "confirm_scope", "contrast_domains"]).toContain(result.bridgeHint);
	});

	it("includes questionStyle on all results", () => {
		const result = realizeMicroIntent(input({}));
		expect(["open", "choice"]).toContain(result.questionStyle);
	});

	it("alternates questionStyle based on turnIndex", () => {
		const even = realizeMicroIntent(input({ turnIndex: 10 }));
		const odd = realizeMicroIntent(input({ turnIndex: 11 }));
		expect(even.questionStyle).toBe("open");
		expect(odd.questionStyle).toBe("choice");
	});

	it("nearingEnd takes priority over domain_shift", () => {
		const result = realizeMicroIntent(
			input({ nearingEnd: true, targetDomain: "leisure", previousDomain: "work" }),
		);
		expect(result.intent).toBe("depth_push");
	});

	it("domain_shift takes priority over depth_push from streak", () => {
		const result = realizeMicroIntent(
			input({ targetDomain: "leisure", previousDomain: "work", domainStreak: 5 }),
		);
		expect(result.intent).toBe("domain_shift");
	});

	it("cycles through intents in mid/late conversation", () => {
		const intents: IntentType[] = [];
		for (let i = 6; i < 12; i++) {
			const result = realizeMicroIntent(input({ turnIndex: i, domainStreak: 1 }));
			intents.push(result.intent);
		}
		expect(intents).toContain("tradeoff_probe");
		expect(intents).toContain("contradiction_surface");
		expect(intents).toContain("story_pull");
	});
});
