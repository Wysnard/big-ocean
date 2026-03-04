import { describe, expect, it } from "vitest";
import { lookupArchetype } from "../archetype-lookup";

describe("lookupArchetype", () => {
	describe("hand-curated archetypes — all 81 entries", () => {
		// O-Group: Open-Minded (27)

		it("ODEW → The Beacon", () => {
			expect(lookupArchetype("OCEA").name).toBe("The Beacon");
		});

		it("ODEN → The Architect", () => {
			expect(lookupArchetype("OCEP").name).toBe("The Architect");
		});

		it("ODEC → The Forge", () => {
			expect(lookupArchetype("OCED").name).toBe("The Forge");
		});

		it("ODAW → The Tapestry", () => {
			expect(lookupArchetype("OCBA").name).toBe("The Tapestry");
		});

		it("ODAN → The Compass", () => {
			expect(lookupArchetype("OCBP").name).toBe("The Compass");
		});

		it("ODAC → The Prism", () => {
			expect(lookupArchetype("OCBD").name).toBe("The Prism");
		});

		it("ODIW → The Lantern", () => {
			expect(lookupArchetype("OCRA").name).toBe("The Lantern");
		});

		it("ODIN → The Lens", () => {
			expect(lookupArchetype("OCRP").name).toBe("The Lens");
		});

		it("ODIC → The Clockwork", () => {
			expect(lookupArchetype("OCRD").name).toBe("The Clockwork");
		});

		it("OBEW → The Catalyst", () => {
			expect(lookupArchetype("OSEA").name).toBe("The Catalyst");
		});

		it("OBEN → The Bridge", () => {
			expect(lookupArchetype("OSEP").name).toBe("The Bridge");
		});

		it("OBEC → The Spark", () => {
			expect(lookupArchetype("OSED").name).toBe("The Spark");
		});

		it("OBAW → The Garden", () => {
			expect(lookupArchetype("OSBA").name).toBe("The Garden");
		});

		it("OBAN → The Current", () => {
			expect(lookupArchetype("OSBP").name).toBe("The Current");
		});

		it("OBAC → The Drifter", () => {
			expect(lookupArchetype("OSBD").name).toBe("The Drifter");
		});

		it("OBIW → The Well", () => {
			expect(lookupArchetype("OSRA").name).toBe("The Well");
		});

		it("OBIN → The Pendulum", () => {
			expect(lookupArchetype("OSRP").name).toBe("The Pendulum");
		});

		it("OBIC → The Telescope", () => {
			expect(lookupArchetype("OSRD").name).toBe("The Telescope");
		});

		it("OFEW → The Bonfire", () => {
			expect(lookupArchetype("OFEA").name).toBe("The Bonfire");
		});

		it("OFEN → The Kite", () => {
			expect(lookupArchetype("OFEP").name).toBe("The Kite");
		});

		it("OFEC → The Lightning", () => {
			expect(lookupArchetype("OFED").name).toBe("The Lightning");
		});

		it("OFAW → The Meadow", () => {
			expect(lookupArchetype("OFBA").name).toBe("The Meadow");
		});

		it("OFAN → The Breeze", () => {
			expect(lookupArchetype("OFBP").name).toBe("The Breeze");
		});

		it("OFAC → The Comet", () => {
			expect(lookupArchetype("OFBD").name).toBe("The Comet");
		});

		it("OFIW → The Ember", () => {
			expect(lookupArchetype("OFRA").name).toBe("The Ember");
		});

		it("OFIN → The Tributary", () => {
			expect(lookupArchetype("OFRP").name).toBe("The Tributary");
		});

		it("OFIC → The Lone Flame", () => {
			expect(lookupArchetype("OFRD").name).toBe("The Lone Flame");
		});

		// G-Group: Grounded (27)

		it("GDEW → The Anchor", () => {
			expect(lookupArchetype("MCEA").name).toBe("The Anchor");
		});

		it("GDEN → The Helm", () => {
			expect(lookupArchetype("MCEP").name).toBe("The Helm");
		});

		it("GDEC → The Mast", () => {
			expect(lookupArchetype("MCED").name).toBe("The Mast");
		});

		it("GDAW → The Hearthstone", () => {
			expect(lookupArchetype("MCBA").name).toBe("The Hearthstone");
		});

		it("GDAN → The Keystone", () => {
			expect(lookupArchetype("MCBP").name).toBe("The Keystone");
		});

		it("GDAC → The Bulwark", () => {
			expect(lookupArchetype("MCBD").name).toBe("The Bulwark");
		});

		it("GDIW → The Root", () => {
			expect(lookupArchetype("MCRA").name).toBe("The Root");
		});

		it("GDIN → The Meridian", () => {
			expect(lookupArchetype("MCRP").name).toBe("The Meridian");
		});

		it("GDIC → The Chisel", () => {
			expect(lookupArchetype("MCRD").name).toBe("The Chisel");
		});

		it("GBEW → The Loom", () => {
			expect(lookupArchetype("MSEA").name).toBe("The Loom");
		});

		it("GBEN → The Harbor", () => {
			expect(lookupArchetype("MSEP").name).toBe("The Harbor");
		});

		it("GBEC → The Flint", () => {
			expect(lookupArchetype("MSED").name).toBe("The Flint");
		});

		it("GBAW → The Hearth", () => {
			expect(lookupArchetype("MSBA").name).toBe("The Hearth");
		});

		it("GBAN → The Fulcrum", () => {
			expect(lookupArchetype("MSBP").name).toBe("The Fulcrum");
		});

		it("GBAC → The Ballast", () => {
			expect(lookupArchetype("MSBD").name).toBe("The Ballast");
		});

		it("GBIW → The Spring", () => {
			expect(lookupArchetype("MSRA").name).toBe("The Spring");
		});

		it("GBIN → The Still Water", () => {
			expect(lookupArchetype("MSRP").name).toBe("The Still Water");
		});

		it("GBIC → The Granite", () => {
			expect(lookupArchetype("MSRD").name).toBe("The Granite");
		});

		it("GFEW → The Campfire", () => {
			expect(lookupArchetype("MFEA").name).toBe("The Campfire");
		});

		it("GFEN → The Waypoint", () => {
			expect(lookupArchetype("MFEP").name).toBe("The Waypoint");
		});

		it("GFEC → The Squall", () => {
			expect(lookupArchetype("MFED").name).toBe("The Squall");
		});

		it("GFAW → The Brook", () => {
			expect(lookupArchetype("MFBA").name).toBe("The Brook");
		});

		it("GFAN → The Plateau", () => {
			expect(lookupArchetype("MFBP").name).toBe("The Plateau");
		});

		it("GFAC → The Ridgeline", () => {
			expect(lookupArchetype("MFBD").name).toBe("The Ridgeline");
		});

		it("GFIW → The Moss", () => {
			expect(lookupArchetype("MFRA").name).toBe("The Moss");
		});

		it("GFIN → The Inlet", () => {
			expect(lookupArchetype("MFRP").name).toBe("The Inlet");
		});

		it("GFIC → The Cairn", () => {
			expect(lookupArchetype("MFRD").name).toBe("The Cairn");
		});

		// P-Group: Practical (27)

		it("PDEW → The Pillar", () => {
			expect(lookupArchetype("TCEA").name).toBe("The Pillar");
		});

		it("PDEN → The Banner", () => {
			expect(lookupArchetype("TCEP").name).toBe("The Banner");
		});

		it("PDEC → The Anvil", () => {
			expect(lookupArchetype("TCED").name).toBe("The Anvil");
		});

		it("PDAW → The Cornerstone", () => {
			expect(lookupArchetype("TCBA").name).toBe("The Cornerstone");
		});

		it("PDAN → The Scale", () => {
			expect(lookupArchetype("TCBP").name).toBe("The Scale");
		});

		it("PDAC → The Rampart", () => {
			expect(lookupArchetype("TCBD").name).toBe("The Rampart");
		});

		it("PDIW → The Bedrock", () => {
			expect(lookupArchetype("TCRA").name).toBe("The Bedrock");
		});

		it("PDIN → The Sundial", () => {
			expect(lookupArchetype("TCRP").name).toBe("The Sundial");
		});

		it("PDIC → The Watchtower", () => {
			expect(lookupArchetype("TCRD").name).toBe("The Watchtower");
		});

		it("PBEW → The Bellows", () => {
			expect(lookupArchetype("TSEA").name).toBe("The Bellows");
		});

		it("PBEN → The Crossroads", () => {
			expect(lookupArchetype("TSEP").name).toBe("The Crossroads");
		});

		it("PBEC → The Hammer", () => {
			expect(lookupArchetype("TSED").name).toBe("The Hammer");
		});

		it("PBAW → The Quilt", () => {
			expect(lookupArchetype("TSBA").name).toBe("The Quilt");
		});

		it("PBAN → The Level", () => {
			expect(lookupArchetype("TSBP").name).toBe("The Level");
		});

		it("PBAC → The Milestone", () => {
			expect(lookupArchetype("TSBD").name).toBe("The Milestone");
		});

		it("PBIW → The Wellspring", () => {
			expect(lookupArchetype("TSRA").name).toBe("The Wellspring");
		});

		it("PBIN → The Sextant", () => {
			expect(lookupArchetype("TSRP").name).toBe("The Sextant");
		});

		it("PBIC → The Monolith", () => {
			expect(lookupArchetype("TSRD").name).toBe("The Monolith");
		});

		it("PFEW → The Open Door", () => {
			expect(lookupArchetype("TFEA").name).toBe("The Open Door");
		});

		it("PFEN → The Roundtable", () => {
			expect(lookupArchetype("TFEP").name).toBe("The Roundtable");
		});

		it("PFEC → The Wildfire", () => {
			expect(lookupArchetype("TFED").name).toBe("The Wildfire");
		});

		it("PFAW → The Trellis", () => {
			expect(lookupArchetype("TFBA").name).toBe("The Trellis");
		});

		it("PFAN → The Clearing", () => {
			expect(lookupArchetype("TFBP").name).toBe("The Clearing");
		});

		it("PFAC → The Trailhead", () => {
			expect(lookupArchetype("TFBD").name).toBe("The Trailhead");
		});

		it("PFIW → The Candle", () => {
			expect(lookupArchetype("TFRA").name).toBe("The Candle");
		});

		it("PFIN → The Cove", () => {
			expect(lookupArchetype("TFRP").name).toBe("The Cove");
		});

		it("PFIC → The Lone Star", () => {
			expect(lookupArchetype("TFRD").name).toBe("The Lone Star");
		});
	});

	describe("all curated entries have valid properties", () => {
		const allCodes = [
			"OCEA",
			"OCEP",
			"OCED",
			"OCBA",
			"OCBP",
			"OCBD",
			"OCRA",
			"OCRP",
			"OCRD",
			"OSEA",
			"OSEP",
			"OSED",
			"OSBA",
			"OSBP",
			"OSBD",
			"OSRA",
			"OSRP",
			"OSRD",
			"OFEA",
			"OFEP",
			"OFED",
			"OFBA",
			"OFBP",
			"OFBD",
			"OFRA",
			"OFRP",
			"OFRD",
			"MCEA",
			"MCEP",
			"MCED",
			"MCBA",
			"MCBP",
			"MCBD",
			"MCRA",
			"MCRP",
			"MCRD",
			"MSEA",
			"MSEP",
			"MSED",
			"MSBA",
			"MSBP",
			"MSBD",
			"MSRA",
			"MSRP",
			"MSRD",
			"MFEA",
			"MFEP",
			"MFED",
			"MFBA",
			"MFBP",
			"MFBD",
			"MFRA",
			"MFRP",
			"MFRD",
			"TCEA",
			"TCEP",
			"TCED",
			"TCBA",
			"TCBP",
			"TCBD",
			"TCRA",
			"TCRP",
			"TCRD",
			"TSEA",
			"TSEP",
			"TSED",
			"TSBA",
			"TSBP",
			"TSBD",
			"TSRA",
			"TSRP",
			"TSRD",
			"TFEA",
			"TFEP",
			"TFED",
			"TFBA",
			"TFBP",
			"TFBD",
			"TFRA",
			"TFRP",
			"TFRD",
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
			const first = lookupArchetype("OCBA");
			for (let i = 0; i < 100; i++) {
				const result = lookupArchetype("OCBA");
				expect(result).toEqual(first);
			}
		});
	});
});
