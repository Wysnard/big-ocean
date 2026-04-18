import { expect, type Page, test } from "@playwright/test";

const DESKTOP_VIEWPORT = { width: 1440, height: 1200 } as const;

async function gotoArticle(page: Page, path: string) {
	await page.setViewportSize(DESKTOP_VIEWPORT);
	await page.goto(path);
	await expect(page.locator('nav[aria-label="On this page"]')).toBeVisible();
}

async function scrollHeadingToTop(page: Page, id: string) {
	const heading = page.locator(`#${id}`);
	await expect(heading).toBeVisible();
	await heading.evaluate((element) => {
		element.scrollIntoView({ block: "start" });
	});
}

async function expectActiveRailLabel(page: Page, label: string) {
	const rail = page.locator('nav[aria-label="On this page"]');
	await expect
		.poll(async () => {
			return (
				(await rail.locator('li[data-active="true"]').textContent())?.replace(/\s+/g, " ").trim() ??
				null
			);
		})
		.toContain(label);
}

async function clickRailLink(page: Page, label: string) {
	await page
		.locator('nav[aria-label="On this page"]')
		.getByRole("link", { name: label, exact: true })
		.click();
}

async function expectHashAndHeadingInViewport(page: Page, hash: string) {
	await expect(page).toHaveURL(new RegExp(`${hash}$`));
	await expect
		.poll(async () => {
			return page.evaluate(
				(id) => document.getElementById(id)?.getBoundingClientRect().top ?? null,
				hash,
			);
		})
		.toBeLessThan(DESKTOP_VIEWPORT.height);
}

test.describe("Library article reading rail", () => {
	test("trait article rail links and continue exploring navigation work @smoke", async ({
		page,
	}) => {
		await test.step("load the trait article", async () => {
			await gotoArticle(page, "/library/trait/openness");
			await expect(
				page.getByRole("heading", { name: "Openness Trait Guide", level: 1 }),
			).toBeVisible();
		});

		await test.step("desktop rail links jump to deep article sections", async () => {
			await clickRailLink(page, "High openness in daily life");
			await expectHashAndHeadingInViewport(page, "high-openness-in-daily-life");

			await clickRailLink(page, "Facet breakdown");
			await expectHashAndHeadingInViewport(page, "facet-breakdown");
		});

		await test.step("continue exploring navigates to the linked facet article", async () => {
			await page.getByRole("link", { name: /read imagination facet guide/i }).click();
			await page.waitForURL(/\/library\/facet\/imagination$/);
		});
	});

	test("facet article rail links and parent trait navigation work @smoke", async ({ page }) => {
		await test.step("load the facet article", async () => {
			await gotoArticle(page, "/library/facet/imagination");
			await expect(
				page.getByRole("heading", { name: "Imagination Facet Guide", level: 1 }),
			).toBeVisible();
		});

		await test.step("desktop rail links jump to deep article sections", async () => {
			await clickRailLink(page, "When imagination is vivid");
			await expectHashAndHeadingInViewport(page, "when-imagination-is-vivid");

			await clickRailLink(page, "How it shows up in daily life");
			await expectHashAndHeadingInViewport(page, "how-it-shows-up-in-daily-life");
		});

		await test.step("parent trait link returns to the trait article", async () => {
			await page.getByRole("link", { name: /read the openness guide/i }).click();
			await page.waitForURL(/\/library\/trait\/openness$/);
		});
	});

	test("archetype article rail links and compatible cards navigation work @smoke", async ({
		page,
	}) => {
		await test.step("load the archetype article", async () => {
			await gotoArticle(page, "/library/archetype/beacon-personality-archetype");
			await expect(
				page.getByRole("heading", { name: "The Beacon Personality Archetype", level: 1 }),
			).toBeVisible();
		});

		await test.step("desktop rail links jump to the last two article sections", async () => {
			await clickRailLink(page, "Growth areas");
			await expectHashAndHeadingInViewport(page, "growth-areas");

			await clickRailLink(page, "Compatible archetypes");
			await expectHashAndHeadingInViewport(page, "compatible-archetypes");
		});

		await test.step("compatible archetype cards navigate to related articles", async () => {
			await page.getByTestId("compatible-archetype-anchor-personality-archetype").click();
			await page.waitForURL(/\/library\/archetype\/anchor-personality-archetype$/);
		});
	});

	test("trait article desktop rail auto-highlights the last two chapters while scrolling @smoke", async ({
		page,
	}) => {
		await gotoArticle(page, "/library/trait/openness");
		await scrollHeadingToTop(page, "high-openness-in-daily-life");
		await expectActiveRailLabel(page, "High openness in daily life");
		await scrollHeadingToTop(page, "facet-breakdown");
		await expectActiveRailLabel(page, "Facet breakdown");
	});

	test("facet article desktop rail stays on the top-aligned prose chapter near the bottom @smoke", async ({
		page,
	}) => {
		await gotoArticle(page, "/library/facet/imagination");
		await scrollHeadingToTop(page, "how-it-shows-up-in-daily-life");
		await expectActiveRailLabel(page, "What imagination measures");
	});

	test("archetype article desktop rail stays on the top-aligned chapter near the bottom @smoke", async ({
		page,
	}) => {
		await gotoArticle(page, "/library/archetype/beacon-personality-archetype");
		await scrollHeadingToTop(page, "compatible-archetypes");
		await expectActiveRailLabel(page, "Strengths");
	});
});
