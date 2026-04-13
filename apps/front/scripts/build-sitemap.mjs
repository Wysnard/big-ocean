import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_ORIGIN = process.env.VITE_APP_URL ?? "https://bigocean.dev";
const APP_ROOT = process.cwd();
const CONTENT_ROOT = path.join(APP_ROOT, "src", "content", "library");
const OUTPUT_PATH = path.join(APP_ROOT, "public", "sitemap.xml");

function stripWrappingQuotes(value) {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}

	return value;
}

function parseFrontmatter(source) {
	const match = source.match(/^---\n([\s\S]*?)\n---\n?/);

	if (!match) {
		throw new Error("Missing frontmatter block");
	}

	const frontmatter = {};

	for (const line of match[1].split("\n")) {
		const trimmedLine = line.trim();

		if (!trimmedLine) {
			continue;
		}

		const separatorIndex = trimmedLine.indexOf(":");

		if (separatorIndex === -1) {
			throw new Error(`Invalid frontmatter line "${trimmedLine}"`);
		}

		const key = trimmedLine.slice(0, separatorIndex).trim();
		const value = stripWrappingQuotes(trimmedLine.slice(separatorIndex + 1).trim());

		frontmatter[key] = value;
	}

	return frontmatter;
}

async function walkLibraryFiles(root) {
	const entries = await readdir(root, { withFileTypes: true });
	const results = [];

	for (const entry of entries) {
		const entryPath = path.join(root, entry.name);

		if (entry.isDirectory()) {
			results.push(...(await walkLibraryFiles(entryPath)));
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".mdx")) {
			results.push(entryPath);
		}
	}

	return results;
}

async function buildLibraryEntries() {
	const filePaths = await walkLibraryFiles(CONTENT_ROOT);

	return Promise.all(
		filePaths.map(async (filePath) => {
			const source = await readFile(filePath, "utf8");
			const frontmatter = parseFrontmatter(source);
			const fileStat = await stat(filePath);

			if (!frontmatter.tier || !frontmatter.slug) {
				throw new Error(`Missing tier or slug in ${filePath}`);
			}

			return {
				pathname: `/library/${frontmatter.tier}/${frontmatter.slug}`,
				changefreq: "weekly",
				lastmod: fileStat.mtime.toISOString().slice(0, 10),
			};
		}),
	);
}

function buildPublicProfileEntries() {
	const ids = (process.env.SITEMAP_PUBLIC_PROFILE_IDS ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);

	return ids.map((id) => ({
		pathname: `/public-profile/${id}`,
		changefreq: "daily",
		lastmod: new Date().toISOString().slice(0, 10),
	}));
}

function renderUrl(entry) {
	return `  <url>
    <loc>${SITE_ORIGIN}${entry.pathname}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
  </url>`;
}

async function main() {
	const entries = [
		{
			pathname: "/",
			changefreq: "daily",
			lastmod: new Date().toISOString().slice(0, 10),
		},
		{
			pathname: "/library",
			changefreq: "weekly",
			lastmod: new Date().toISOString().slice(0, 10),
		},
		...(await buildLibraryEntries()),
		...buildPublicProfileEntries(),
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(renderUrl).join("\n")}
</urlset>
`;

	await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
	await writeFile(OUTPUT_PATH, xml, "utf8");

	console.log(`Generated ${entries.length} sitemap URLs at ${OUTPUT_PATH}`);
}

void main();
