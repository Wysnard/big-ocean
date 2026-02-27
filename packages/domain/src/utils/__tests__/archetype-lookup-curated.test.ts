import { describe, expect, it } from "vitest";
import { lookupArchetype } from "../archetype-lookup";

describe("lookupArchetype", () => {
	describe("hand-curated archetypes — all 81 entries", () => {
		// O-Group: Open-Minded (27)

		it("ODEW → The Beacon", () => {
			expect(lookupArchetype("ODEW").name).toBe("The Beacon");
		});

		it("ODEN → The Architect", () => {
			expect(lookupArchetype("ODEN").name).toBe("The Architect");
		});

		it("ODEC → The Forge", () => {
			expect(lookupArchetype("ODEC").name).toBe("The Forge");
		});

		it("ODAW → The Tapestry", () => {
			expect(lookupArchetype("ODAW").name).toBe("The Tapestry");
		});

		it("ODAN → The Compass", () => {
			expect(lookupArchetype("ODAN").name).toBe("The Compass");
		});

		it("ODAC → The Prism", () => {
			expect(lookupArchetype("ODAC").name).toBe("The Prism");
		});

		it("ODIW → The Lantern", () => {
			expect(lookupArchetype("ODIW").name).toBe("The Lantern");
		});

		it("ODIN → The Lens", () => {
			expect(lookupArchetype("ODIN").name).toBe("The Lens");
		});

		it("ODIC → The Clockwork", () => {
			expect(lookupArchetype("ODIC").name).toBe("The Clockwork");
		});

		it("OBEW → The Catalyst", () => {
			expect(lookupArchetype("OBEW").name).toBe("The Catalyst");
		});

		it("OBEN → The Bridge", () => {
			expect(lookupArchetype("OBEN").name).toBe("The Bridge");
		});

		it("OBEC → The Spark", () => {
			expect(lookupArchetype("OBEC").name).toBe("The Spark");
		});

		it("OBAW → The Garden", () => {
			expect(lookupArchetype("OBAW").name).toBe("The Garden");
		});

		it("OBAN → The Current", () => {
			expect(lookupArchetype("OBAN").name).toBe("The Current");
		});

		it("OBAC → The Drifter", () => {
			expect(lookupArchetype("OBAC").name).toBe("The Drifter");
		});

		it("OBIW → The Well", () => {
			expect(lookupArchetype("OBIW").name).toBe("The Well");
		});

		it("OBIN → The Pendulum", () => {
			expect(lookupArchetype("OBIN").name).toBe("The Pendulum");
		});

		it("OBIC → The Telescope", () => {
			expect(lookupArchetype("OBIC").name).toBe("The Telescope");
		});

		it("OFEW → The Bonfire", () => {
			expect(lookupArchetype("OFEW").name).toBe("The Bonfire");
		});

		it("OFEN → The Kite", () => {
			expect(lookupArchetype("OFEN").name).toBe("The Kite");
		});

		it("OFEC → The Lightning", () => {
			expect(lookupArchetype("OFEC").name).toBe("The Lightning");
		});

		it("OFAW → The Meadow", () => {
			expect(lookupArchetype("OFAW").name).toBe("The Meadow");
		});

		it("OFAN → The Breeze", () => {
			expect(lookupArchetype("OFAN").name).toBe("The Breeze");
		});

		it("OFAC → The Comet", () => {
			expect(lookupArchetype("OFAC").name).toBe("The Comet");
		});

		it("OFIW → The Ember", () => {
			expect(lookupArchetype("OFIW").name).toBe("The Ember");
		});

		it("OFIN → The Tributary", () => {
			expect(lookupArchetype("OFIN").name).toBe("The Tributary");
		});

		it("OFIC → The Lone Flame", () => {
			expect(lookupArchetype("OFIC").name).toBe("The Lone Flame");
		});

		// G-Group: Grounded (27)

		it("GDEW → The Anchor", () => {
			expect(lookupArchetype("GDEW").name).toBe("The Anchor");
		});

		it("GDEN → The Helm", () => {
			expect(lookupArchetype("GDEN").name).toBe("The Helm");
		});

		it("GDEC → The Mast", () => {
			expect(lookupArchetype("GDEC").name).toBe("The Mast");
		});

		it("GDAW → The Hearthstone", () => {
			expect(lookupArchetype("GDAW").name).toBe("The Hearthstone");
		});

		it("GDAN → The Keystone", () => {
			expect(lookupArchetype("GDAN").name).toBe("The Keystone");
		});

		it("GDAC → The Bulwark", () => {
			expect(lookupArchetype("GDAC").name).toBe("The Bulwark");
		});

		it("GDIW → The Root", () => {
			expect(lookupArchetype("GDIW").name).toBe("The Root");
		});

		it("GDIN → The Meridian", () => {
			expect(lookupArchetype("GDIN").name).toBe("The Meridian");
		});

		it("GDIC → The Chisel", () => {
			expect(lookupArchetype("GDIC").name).toBe("The Chisel");
		});

		it("GBEW → The Loom", () => {
			expect(lookupArchetype("GBEW").name).toBe("The Loom");
		});

		it("GBEN → The Harbor", () => {
			expect(lookupArchetype("GBEN").name).toBe("The Harbor");
		});

		it("GBEC → The Flint", () => {
			expect(lookupArchetype("GBEC").name).toBe("The Flint");
		});

		it("GBAW → The Hearth", () => {
			expect(lookupArchetype("GBAW").name).toBe("The Hearth");
		});

		it("GBAN → The Fulcrum", () => {
			expect(lookupArchetype("GBAN").name).toBe("The Fulcrum");
		});

		it("GBAC → The Ballast", () => {
			expect(lookupArchetype("GBAC").name).toBe("The Ballast");
		});

		it("GBIW → The Spring", () => {
			expect(lookupArchetype("GBIW").name).toBe("The Spring");
		});

		it("GBIN → The Still Water", () => {
			expect(lookupArchetype("GBIN").name).toBe("The Still Water");
		});

		it("GBIC → The Granite", () => {
			expect(lookupArchetype("GBIC").name).toBe("The Granite");
		});

		it("GFEW → The Campfire", () => {
			expect(lookupArchetype("GFEW").name).toBe("The Campfire");
		});

		it("GFEN → The Waypoint", () => {
			expect(lookupArchetype("GFEN").name).toBe("The Waypoint");
		});

		it("GFEC → The Squall", () => {
			expect(lookupArchetype("GFEC").name).toBe("The Squall");
		});

		it("GFAW → The Brook", () => {
			expect(lookupArchetype("GFAW").name).toBe("The Brook");
		});

		it("GFAN → The Plateau", () => {
			expect(lookupArchetype("GFAN").name).toBe("The Plateau");
		});

		it("GFAC → The Ridgeline", () => {
			expect(lookupArchetype("GFAC").name).toBe("The Ridgeline");
		});

		it("GFIW → The Moss", () => {
			expect(lookupArchetype("GFIW").name).toBe("The Moss");
		});

		it("GFIN → The Inlet", () => {
			expect(lookupArchetype("GFIN").name).toBe("The Inlet");
		});

		it("GFIC → The Cairn", () => {
			expect(lookupArchetype("GFIC").name).toBe("The Cairn");
		});

		// P-Group: Practical (27)

		it("PDEW → The Pillar", () => {
			expect(lookupArchetype("PDEW").name).toBe("The Pillar");
		});

		it("PDEN → The Banner", () => {
			expect(lookupArchetype("PDEN").name).toBe("The Banner");
		});

		it("PDEC → The Anvil", () => {
			expect(lookupArchetype("PDEC").name).toBe("The Anvil");
		});

		it("PDAW → The Cornerstone", () => {
			expect(lookupArchetype("PDAW").name).toBe("The Cornerstone");
		});

		it("PDAN → The Scale", () => {
			expect(lookupArchetype("PDAN").name).toBe("The Scale");
		});

		it("PDAC → The Rampart", () => {
			expect(lookupArchetype("PDAC").name).toBe("The Rampart");
		});

		it("PDIW → The Bedrock", () => {
			expect(lookupArchetype("PDIW").name).toBe("The Bedrock");
		});

		it("PDIN → The Sundial", () => {
			expect(lookupArchetype("PDIN").name).toBe("The Sundial");
		});

		it("PDIC → The Watchtower", () => {
			expect(lookupArchetype("PDIC").name).toBe("The Watchtower");
		});

		it("PBEW → The Bellows", () => {
			expect(lookupArchetype("PBEW").name).toBe("The Bellows");
		});

		it("PBEN → The Crossroads", () => {
			expect(lookupArchetype("PBEN").name).toBe("The Crossroads");
		});

		it("PBEC → The Hammer", () => {
			expect(lookupArchetype("PBEC").name).toBe("The Hammer");
		});

		it("PBAW → The Quilt", () => {
			expect(lookupArchetype("PBAW").name).toBe("The Quilt");
		});

		it("PBAN → The Level", () => {
			expect(lookupArchetype("PBAN").name).toBe("The Level");
		});

		it("PBAC → The Milestone", () => {
			expect(lookupArchetype("PBAC").name).toBe("The Milestone");
		});

		it("PBIW → The Wellspring", () => {
			expect(lookupArchetype("PBIW").name).toBe("The Wellspring");
		});

		it("PBIN → The Sextant", () => {
			expect(lookupArchetype("PBIN").name).toBe("The Sextant");
		});

		it("PBIC → The Monolith", () => {
			expect(lookupArchetype("PBIC").name).toBe("The Monolith");
		});

		it("PFEW → The Open Door", () => {
			expect(lookupArchetype("PFEW").name).toBe("The Open Door");
		});

		it("PFEN → The Roundtable", () => {
			expect(lookupArchetype("PFEN").name).toBe("The Roundtable");
		});

		it("PFEC → The Wildfire", () => {
			expect(lookupArchetype("PFEC").name).toBe("The Wildfire");
		});

		it("PFAW → The Trellis", () => {
			expect(lookupArchetype("PFAW").name).toBe("The Trellis");
		});

		it("PFAN → The Clearing", () => {
			expect(lookupArchetype("PFAN").name).toBe("The Clearing");
		});

		it("PFAC → The Trailhead", () => {
			expect(lookupArchetype("PFAC").name).toBe("The Trailhead");
		});

		it("PFIW → The Candle", () => {
			expect(lookupArchetype("PFIW").name).toBe("The Candle");
		});

		it("PFIN → The Cove", () => {
			expect(lookupArchetype("PFIN").name).toBe("The Cove");
		});

		it("PFIC → The Lone Star", () => {
			expect(lookupArchetype("PFIC").name).toBe("The Lone Star");
		});
	});

	describe("all curated entries have valid properties", () => {
		const allCodes = [
			"ODEW",
			"ODEN",
			"ODEC",
			"ODAW",
			"ODAN",
			"ODAC",
			"ODIW",
			"ODIN",
			"ODIC",
			"OBEW",
			"OBEN",
			"OBEC",
			"OBAW",
			"OBAN",
			"OBAC",
			"OBIW",
			"OBIN",
			"OBIC",
			"OFEW",
			"OFEN",
			"OFEC",
			"OFAW",
			"OFAN",
			"OFAC",
			"OFIW",
			"OFIN",
			"OFIC",
			"GDEW",
			"GDEN",
			"GDEC",
			"GDAW",
			"GDAN",
			"GDAC",
			"GDIW",
			"GDIN",
			"GDIC",
			"GBEW",
			"GBEN",
			"GBEC",
			"GBAW",
			"GBAN",
			"GBAC",
			"GBIW",
			"GBIN",
			"GBIC",
			"GFEW",
			"GFEN",
			"GFEC",
			"GFAW",
			"GFAN",
			"GFAC",
			"GFIW",
			"GFIN",
			"GFIC",
			"PDEW",
			"PDEN",
			"PDEC",
			"PDAW",
			"PDAN",
			"PDAC",
			"PDIW",
			"PDIN",
			"PDIC",
			"PBEW",
			"PBEN",
			"PBEC",
			"PBAW",
			"PBAN",
			"PBAC",
			"PBIW",
			"PBIN",
			"PBIC",
			"PFEW",
			"PFEN",
			"PFEC",
			"PFAW",
			"PFAN",
			"PFAC",
			"PFIW",
			"PFIN",
			"PFIC",
		];

		it("isCurated is true for all 81 entries", () => {
			for (const code of allCodes) {
				const result = lookupArchetype(code);
				expect(result.isCurated).toBe(true);
			}
		});

		it("all entries have non-empty names starting with 'The '", () => {
			for (const code of allCodes) {
				const result = lookupArchetype(code);
				expect(result.name).toMatch(/^The /);
			}
		});

		it("all entries have descriptions between 1500-2500 chars", () => {
			for (const code of allCodes) {
				const result = lookupArchetype(code);
				expect(result.description.length).toBeGreaterThanOrEqual(1500);
				expect(result.description.length).toBeLessThanOrEqual(2500);
			}
		});

		it("all entries have valid hex colors", () => {
			for (const code of allCodes) {
				const result = lookupArchetype(code);
				expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
			}
		});
	});

	describe("determinism", () => {
		it("same code returns identical result across 100 calls", () => {
			const first = lookupArchetype("ODAW");
			for (let i = 0; i < 100; i++) {
				const result = lookupArchetype("ODAW");
				expect(result).toEqual(first);
			}
		});
	});
});
