import { describe, expect, it } from "vitest";

import {
	archetypeShortNameFromTitle,
	estimateReadMinutesFromMdxRaw,
	extractArchetypeOverviewFirstParagraph,
	normalizeMdxRawSource,
} from "./library-mdx-helpers";

describe("normalizeMdxRawSource", () => {
	it("accepts plain strings", () => {
		expect(normalizeMdxRawSource("abc")).toBe("abc");
	});

	it("unwraps Vite-style default export objects", () => {
		expect(normalizeMdxRawSource({ default: "---\nx: 1\n---\nbody" })).toBe("---\nx: 1\n---\nbody");
	});

	it("returns undefined for unsupported values", () => {
		expect(normalizeMdxRawSource(null)).toBeUndefined();
		expect(normalizeMdxRawSource(123)).toBeUndefined();
	});
});

describe("estimateReadMinutesFromMdxRaw", () => {
	it("excludes frontmatter and returns at least 1 minute", () => {
		const fm = `---
title: X
---
`;
		const body = `${fm}${"word ".repeat(400)}`;
		expect(estimateReadMinutesFromMdxRaw(body)).toBe(2);
	});

	it("returns 1 for empty body after frontmatter", () => {
		expect(estimateReadMinutesFromMdxRaw("---\na: 1\n---\n")).toBe(1);
	});

	it("accepts wrapped default raw modules", () => {
		const fm = `---
title: X
---
`;
		const wrapped = { default: `${fm}${"word ".repeat(400)}` };
		expect(estimateReadMinutesFromMdxRaw(wrapped)).toBe(2);
	});
});

describe("extractArchetypeOverviewFirstParagraph", () => {
	it("returns first overview paragraph", () => {
		const raw = `---
title: T
---
<h2 id="overview">Overview</h2>

Hello world. Second sentence.

<h2 id="next">Next</h2>
`;
		expect(extractArchetypeOverviewFirstParagraph(raw)).toBe("Hello world. Second sentence.");
	});

	it("unwraps default-export raw source", () => {
		const raw = {
			default: `---
title: T
---
<h2 id="overview">Overview</h2>

Wrapped paragraph.

<h2 id="next">Next</h2>
`,
		};
		expect(extractArchetypeOverviewFirstParagraph(raw)).toBe("Wrapped paragraph.");
	});
});

describe("archetypeShortNameFromTitle", () => {
	it("strips leading The and takes first word", () => {
		expect(archetypeShortNameFromTitle("The Beacon Personality Archetype")).toBe("Beacon");
	});
});
