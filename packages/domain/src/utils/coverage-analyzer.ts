/**
 * Coverage Analyzer — Evidence-to-Target Pure Function
 *
 * Active steering logic for the Director model.
 *
 * Selector design:
 * - Rank facets with a single history-wide steering metric
 * - Steering metric = support × domain spread
 * - Support keeps growing across the full conversation history
 * - Domain spread rewards balanced coverage across steerable domains
 * - Return one primary facet plus a ranked shortlist of candidate domains
 */
import { ALL_FACETS, type FacetName, OCEAN_INTERLEAVED_ORDER } from "../constants/big-five";
import { FACET_PROMPT_DEFINITIONS } from "../constants/facet-prompt-definitions";
import {
	LIFE_DOMAIN_DEFINITIONS,
	type LifeDomain,
	STEERABLE_DOMAINS,
} from "../constants/life-domain";
import type { EvidenceInput } from "../types/evidence";
import { computeFinalWeight } from "./formula";

/** Evidence count threshold for switching from opening → exploring phase */
const OPENING_PHASE_THRESHOLD = 10;

export type ConversationPhase = "opening" | "exploring" | "closing";

export interface CoverageTarget {
	readonly primaryFacet: FacetName;
	readonly candidateDomains: LifeDomain[];
	readonly phase: ConversationPhase;
}

export interface CoverageTargetWithDefinitions {
	readonly primaryFacet: { readonly facet: FacetName; readonly definition: string };
	readonly candidateDomains: ReadonlyArray<{
		readonly domain: LifeDomain;
		readonly definition: string;
	}>;
	readonly phase: ConversationPhase;
}

export interface CoverageHistoryEntry {
	readonly turnNumber: number;
	readonly primaryFacet: FacetName;
	readonly preferredDomain: LifeDomain | null;
}

interface FacetCoverageMetrics {
	readonly totalMass: number;
	readonly support: number;
	readonly effectiveDomains: number;
	readonly steeringSignal: number;
	readonly domainMasses: ReadonlyMap<LifeDomain, number>;
}

/**
 * Best-effort decoder for persisted historical coverage targets.
 *
 * Supports both:
 * - new shape: { primaryFacet, candidateDomains }
 * - legacy shape: { targetFacets, targetDomain }
 */
export function extractCoverageHistoryEntry(input: {
	readonly turnNumber: number;
	readonly coverageTargets: unknown;
}): CoverageHistoryEntry | null {
	if (!input.coverageTargets || typeof input.coverageTargets !== "object") return null;

	const record = input.coverageTargets as Record<string, unknown>;
	const primaryFacet = parseFacet(record.primaryFacet) ?? parseFirstFacet(record.targetFacets);
	if (!primaryFacet) return null;

	const preferredDomain =
		parseFirstDomain(record.candidateDomains) ?? parseDomain(record.targetDomain) ?? null;

	return {
		turnNumber: input.turnNumber,
		primaryFacet,
		preferredDomain,
	};
}

/**
 * Analyze evidence coverage and return one primary facet plus candidate domains.
 *
 * Ranking:
 * 1. lowest steeringSignal = support × effectiveDomains
 * 2. lowest effectiveDomains
 * 3. lowest totalMass
 * 4. least recently targeted
 * 5. OCEAN interleaved order
 *
 * Domain ranking:
 * - for covered facets: lowest facet-domain mass first
 * - for unseen facets: globally weakest domains first
 * - lightly avoid repeating the previous preferred domain
 */
export function analyzeCoverage(
	evidence: EvidenceInput[],
	options: { readonly history?: readonly CoverageHistoryEntry[] } = {},
): CoverageTarget {
	const facetMetrics = buildFacetCoverageMetrics(evidence);
	const globalDomainMasses = buildGlobalDomainMasses(facetMetrics);
	const history = options.history ?? [];
	const lastTurnByFacet = buildLastTurnByFacet(history);
	const previousPreferredDomain = getPreviousPreferredDomain(history);

	const facetsByNeed = ALL_FACETS.map((facet) => {
		const metrics = facetMetrics.get(facet) ?? emptyFacetCoverageMetrics();
		return {
			facet,
			...metrics,
			lastTargetedTurn: lastTurnByFacet.get(facet) ?? null,
			interleavedIndex: OCEAN_INTERLEAVED_ORDER.indexOf(facet),
		};
	}).sort((a, b) => {
		if (a.steeringSignal !== b.steeringSignal) return a.steeringSignal - b.steeringSignal;
		if (a.effectiveDomains !== b.effectiveDomains) return a.effectiveDomains - b.effectiveDomains;
		if (a.totalMass !== b.totalMass) return a.totalMass - b.totalMass;

		if (a.lastTargetedTurn === null && b.lastTargetedTurn !== null) return -1;
		if (a.lastTargetedTurn !== null && b.lastTargetedTurn === null) return 1;
		if (a.lastTargetedTurn !== b.lastTargetedTurn) {
			return (
				(a.lastTargetedTurn ?? Number.POSITIVE_INFINITY) -
				(b.lastTargetedTurn ?? Number.POSITIVE_INFINITY)
			);
		}

		return a.interleavedIndex - b.interleavedIndex;
	});

	const primary = facetsByNeed[0];
	const primaryFacet = primary?.facet ?? OCEAN_INTERLEAVED_ORDER[0]!;
	const primaryMetrics = facetMetrics.get(primaryFacet) ?? emptyFacetCoverageMetrics();
	const hasFacetEvidence = primaryMetrics.totalMass > 0;

	const candidateDomains = [...STEERABLE_DOMAINS]
		.map((domain) => ({
			domain,
			facetMass: primaryMetrics.domainMasses.get(domain) ?? 0,
			globalMass: globalDomainMasses.get(domain) ?? 0,
			repeatsPrevious: previousPreferredDomain === domain ? 1 : 0,
			domainIndex: STEERABLE_DOMAINS.indexOf(domain),
		}))
		.sort((a, b) => {
			if (hasFacetEvidence && a.facetMass !== b.facetMass) return a.facetMass - b.facetMass;
			if (a.globalMass !== b.globalMass) return a.globalMass - b.globalMass;
			if (a.repeatsPrevious !== b.repeatsPrevious) return a.repeatsPrevious - b.repeatsPrevious;
			return a.domainIndex - b.domainIndex;
		})
		.slice(0, 3)
		.map((entry) => entry.domain as LifeDomain);

	const phase: ConversationPhase =
		evidence.length < OPENING_PHASE_THRESHOLD ? "opening" : "exploring";

	return { primaryFacet, candidateDomains, phase };
}

export function enrichWithDefinitions(target: CoverageTarget): CoverageTargetWithDefinitions {
	return {
		primaryFacet: {
			facet: target.primaryFacet,
			definition: FACET_PROMPT_DEFINITIONS[target.primaryFacet],
		},
		candidateDomains: target.candidateDomains.map((domain) => ({
			domain,
			definition: LIFE_DOMAIN_DEFINITIONS[domain],
		})),
		phase: target.phase,
	};
}

function buildFacetCoverageMetrics(
	evidence: EvidenceInput[],
): ReadonlyMap<FacetName, FacetCoverageMetrics> {
	const byFacet = new Map<FacetName, Map<LifeDomain, number>>();

	for (const item of evidence) {
		if (!STEERABLE_DOMAINS.includes(item.domain)) continue;

		let domainMasses = byFacet.get(item.bigfiveFacet);
		if (!domainMasses) {
			domainMasses = new Map<LifeDomain, number>();
			byFacet.set(item.bigfiveFacet, domainMasses);
		}

		const weight = computeFinalWeight(item.strength, item.confidence);
		domainMasses.set(item.domain, (domainMasses.get(item.domain) ?? 0) + weight);
	}

	const metrics = new Map<FacetName, FacetCoverageMetrics>();

	for (const [facet, domainMasses] of byFacet) {
		const totalMass = Array.from(domainMasses.values()).reduce((sum, value) => sum + value, 0);
		const support = Math.log1p(totalMass);
		const effectiveDomains = computeEffectiveDomains(totalMass, domainMasses);
		const steeringSignal = support * effectiveDomains;

		metrics.set(facet, {
			totalMass,
			support,
			effectiveDomains,
			steeringSignal,
			domainMasses,
		});
	}

	return metrics;
}

function buildGlobalDomainMasses(
	metrics: ReadonlyMap<FacetName, FacetCoverageMetrics>,
): ReadonlyMap<LifeDomain, number> {
	const globalDomainMasses = new Map<LifeDomain, number>(
		STEERABLE_DOMAINS.map((domain) => [domain, 0] as const),
	);

	for (const metric of metrics.values()) {
		for (const [domain, mass] of metric.domainMasses) {
			globalDomainMasses.set(domain, (globalDomainMasses.get(domain) ?? 0) + mass);
		}
	}

	return globalDomainMasses;
}

function buildLastTurnByFacet(
	history: readonly CoverageHistoryEntry[],
): ReadonlyMap<FacetName, number> {
	const result = new Map<FacetName, number>();

	for (const entry of history) {
		const previous = result.get(entry.primaryFacet);
		if (previous === undefined || entry.turnNumber > previous) {
			result.set(entry.primaryFacet, entry.turnNumber);
		}
	}

	return result;
}

function getPreviousPreferredDomain(history: readonly CoverageHistoryEntry[]): LifeDomain | null {
	let latest: CoverageHistoryEntry | null = null;

	for (const entry of history) {
		if (latest === null || entry.turnNumber > latest.turnNumber) {
			latest = entry;
		}
	}

	return latest?.preferredDomain ?? null;
}

function computeEffectiveDomains(
	totalMass: number,
	domainMasses: ReadonlyMap<LifeDomain, number>,
): number {
	if (totalMass <= 0) return 0;

	let concentration = 0;
	for (const mass of domainMasses.values()) {
		const p = mass / totalMass;
		concentration += p * p;
	}

	return concentration > 0 ? 1 / concentration : 0;
}

function emptyFacetCoverageMetrics(): FacetCoverageMetrics {
	return {
		totalMass: 0,
		support: 0,
		effectiveDomains: 0,
		steeringSignal: 0,
		domainMasses: new Map<LifeDomain, number>(),
	};
}

function parseFacet(value: unknown): FacetName | null {
	return typeof value === "string" && ALL_FACETS.includes(value as FacetName)
		? (value as FacetName)
		: null;
}

function parseFirstFacet(value: unknown): FacetName | null {
	if (!Array.isArray(value)) return null;
	for (const item of value) {
		const facet = parseFacet(item);
		if (facet) return facet;
	}
	return null;
}

function parseDomain(value: unknown): LifeDomain | null {
	return typeof value === "string" && STEERABLE_DOMAINS.includes(value as LifeDomain)
		? (value as LifeDomain)
		: null;
}

function parseFirstDomain(value: unknown): LifeDomain | null {
	if (!Array.isArray(value)) return null;
	for (const item of value) {
		const domain = parseDomain(item);
		if (domain) return domain;
	}
	return null;
}
