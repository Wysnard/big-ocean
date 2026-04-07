#!/usr/bin/env tsx

import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type SkillSource = {
	skillName: string;
	discoveredPath: string;
	resolvedPath: string;
	root: string;
	hash: string;
};

const SKILL_FILE = "SKILL.md";

function getConfiguredRoots(): string[] {
	const configuredRoots = process.env.SKILL_ROOTS?.split(path.delimiter)
		.map((value) => value.trim())
		.filter(Boolean);

	if (configuredRoots?.length) {
		return configuredRoots.map((root) => path.resolve(root));
	}

	return [
		path.resolve(".agents/skills"),
		path.join(os.homedir(), ".agents/skills"),
		path.join(os.homedir(), ".codex/skills"),
		path.join(os.homedir(), ".codex/skills/.system"),
	];
}

async function pathExists(targetPath: string) {
	try {
		await fs.access(targetPath);
		return true;
	} catch {
		return false;
	}
}

function parseSkillName(content: string, fallbackName: string) {
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

	if (!frontmatterMatch) {
		return fallbackName;
	}

	const nameMatch = frontmatterMatch[1].match(/^name:\s*["']?([^"'\n]+)["']?\s*$/m);
	return nameMatch?.[1]?.trim() || fallbackName;
}

function createHash(content: string) {
	return crypto.createHash("sha256").update(content).digest("hex");
}

async function collectSkills(root: string): Promise<SkillSource[]> {
	if (!(await pathExists(root))) {
		return [];
	}

	const entries = await fs.readdir(root, { withFileTypes: true });
	const skills: SkillSource[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory() && !entry.isSymbolicLink()) {
			continue;
		}

		const discoveredPath = path.join(root, entry.name);
		const skillFilePath = path.join(discoveredPath, SKILL_FILE);

		if (!(await pathExists(skillFilePath))) {
			continue;
		}

		const content = await fs.readFile(skillFilePath, "utf8");
		const resolvedPath = await fs.realpath(discoveredPath);

		skills.push({
			skillName: parseSkillName(content, entry.name),
			discoveredPath,
			resolvedPath,
			root,
			hash: createHash(content),
		});
	}

	return skills;
}

function formatSource(source: SkillSource) {
	const details = [`- ${source.discoveredPath}`];

	if (source.resolvedPath !== source.discoveredPath) {
		details.push(`  resolved: ${source.resolvedPath}`);
	}

	details.push(`  root: ${source.root}`);
	return details.join("\n");
}

async function main() {
	const roots = getConfiguredRoots();
	const sources = (await Promise.all(roots.map((root) => collectSkills(root)))).flat();
	const byName = new Map<string, SkillSource[]>();

	for (const source of sources) {
		const group = byName.get(source.skillName) ?? [];
		group.push(source);
		byName.set(source.skillName, group);
	}

	const duplicates = [...byName.entries()]
		.filter(([, group]) => group.length > 1)
		.sort(([left], [right]) => left.localeCompare(right));

	if (!duplicates.length) {
		console.log(`No duplicate skills found across ${roots.length} roots.`);
		return;
	}

	console.error("Duplicate skill names detected.\n");
	console.error("Discovery roots:");

	for (const root of roots) {
		console.error(`- ${root}`);
	}

	console.error("");

	for (const [skillName, group] of duplicates) {
		const uniqueHashes = new Set(group.map((source) => source.hash));
		const collisionType =
			uniqueHashes.size === 1 ? "exact duplicate definitions" : "conflicting definitions";

		console.error(`${skillName}: ${collisionType}`);

		for (const source of group) {
			console.error(formatSource(source));
		}

		console.error("");
	}

	console.error("Next step:");
	console.error("- keep one source of truth per skill name, or");
	console.error(`- set ${"`SKILL_ROOTS`"} with a reduced root list before starting the toolchain.`);

	process.exitCode = 1;
}

void main();
