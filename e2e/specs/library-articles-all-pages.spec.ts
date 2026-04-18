import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { expect, test } from "@playwright/test";

const REPO_ROOT = resolve(import.meta.dirname, "../..");

const DESKTOP = { width: 1440, height: 1200 } as const;

function mdxSlugs(subdir: "traits" | "facets" | "archetypes"): string[] {
	const dir = join(REPO_ROOT, "apps/front/src/content/library", subdir);
	return readdirSync(dir)
		.filter((name) => name.endsWith(".mdx"))
		.map((name) => name.replace(/\.mdx$/, ""));
}

const TRAIT_SLUGS = mdxSlugs("traits");
const FACET_SLUGS = mdxSlugs("facets");
const ARCHETYPE_SLUGS = mdxSlugs("archetypes");

test.describe("Library articles — every MDX page loads (desktop)", () => {
	test.use({ viewport: DESKTOP });

	for (const slug of TRAIT_SLUGS) {
		test(`trait /library/trait/${slug}`, async ({ page }) => {
			const res = await page.goto(`/library/trait/${slug}`);
			expect(res, `trait ${slug}: no response`).toBeTruthy();
			expect(res.status(), `trait ${slug}`).toBeLessThan(400);
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
			await expect(page.locator('nav[aria-label="On this page"]')).toBeVisible();
			await expect(page.locator('nav[aria-label="On this page"] li[data-active="true"]')).toHaveCount(
				1,
			);
		});
	}

	for (const slug of FACET_SLUGS) {
		test(`facet /library/facet/${slug}`, async ({ page }) => {
			const res = await page.goto(`/library/facet/${slug}`);
			expect(res, `facet ${slug}: no response`).toBeTruthy();
			expect(res.status(), `facet ${slug}`).toBeLessThan(400);
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
			await expect(page.locator('nav[aria-label="On this page"]')).toBeVisible();
			await expect(page.locator('nav[aria-label="On this page"] li[data-active="true"]')).toHaveCount(
				1,
			);
		});
	}

	for (const slug of ARCHETYPE_SLUGS) {
		test(`archetype /library/archetype/${slug}`, async ({ page }) => {
			const res = await page.goto(`/library/archetype/${slug}`);
			expect(res, `archetype ${slug}: no response`).toBeTruthy();
			expect(res.status(), `archetype ${slug}`).toBeLessThan(400);
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
			await expect(page.locator('nav[aria-label="On this page"]')).toBeVisible();
			await expect(page.locator('nav[aria-label="On this page"] li[data-active="true"]')).toHaveCount(
				1,
			);
		});
	}
});
