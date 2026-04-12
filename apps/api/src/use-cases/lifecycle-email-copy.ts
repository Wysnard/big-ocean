import type { AssessmentResultRecord } from "@workspace/domain";
import type { ExchangeRecord } from "@workspace/domain/repositories/exchange.repository";

const DOMAIN_LABELS: Record<string, string> = {
	work: "work and ambition",
	relationships: "your close relationships",
	family: "family life",
	leisure: "the parts of life that feel playful or alive",
	health: "your energy and self-care",
	other: "the quieter corners of your life",
};

const GENERIC_DROP_OFF_TOPIC = "the thread you had just started to pull on";
const GENERIC_CHECK_IN_THEME = "the part of you that's still unfolding";

type CoverageTargetsShape = {
	readonly primaryFacet?: unknown;
	readonly candidateDomains?: unknown;
};

const humanize = (value: string): string => value.replaceAll("_", " ").trim();

const lowercaseFirst = (value: string): string =>
	value.length === 0 ? value : value[0]?.toLowerCase() + value.slice(1);

const getLatestRelevantExchange = (exchanges: readonly ExchangeRecord[]): ExchangeRecord | null => {
	for (let index = exchanges.length - 1; index >= 0; index--) {
		const exchange = exchanges[index];
		if (!exchange) continue;
		if (exchange.coverageTargets != null || exchange.directorOutput != null) {
			return exchange;
		}
	}

	return null;
};

const getCoverageTargets = (exchange: ExchangeRecord | null): CoverageTargetsShape | null => {
	if (!exchange?.coverageTargets || typeof exchange.coverageTargets !== "object") {
		return null;
	}

	return exchange.coverageTargets as CoverageTargetsShape;
};

const getPrimaryFacet = (targets: CoverageTargetsShape | null): string | null => {
	const value = targets?.primaryFacet;
	return typeof value === "string" && value.trim().length > 0 ? humanize(value) : null;
};

const getPrimaryDomain = (targets: CoverageTargetsShape | null): string | null => {
	const rawDomains = targets?.candidateDomains;

	if (!Array.isArray(rawDomains) || rawDomains.length === 0) {
		return null;
	}

	const first = rawDomains[0];
	if (typeof first === "string" && first.trim().length > 0) {
		return first;
	}

	if (
		first &&
		typeof first === "object" &&
		"domain" in first &&
		typeof first.domain === "string" &&
		first.domain.trim().length > 0
	) {
		return first.domain;
	}

	return null;
};

const normalizeDirectorPhrase = (directorOutput: string | null): string | null => {
	if (!directorOutput) return null;

	const cleaned = directorOutput
		.replace(/^(continue\s+)?(exploring|explore|stay with|dig into|look at|follow|revisit)\s+/i, "")
		.replace(/\.$/, "")
		.trim();

	if (cleaned.length === 0) return null;

	const normalized = lowercaseFirst(cleaned);

	if (
		/^(your|the|how|what|where|why|when|who|their|his|her|its|a|an|some|this|that|those|these)\b/i.test(
			normalized,
		)
	) {
		return normalized;
	}

	return normalized;
};

const deriveExchangePhrase = (exchanges: readonly ExchangeRecord[]): string | null => {
	const latestExchange = getLatestRelevantExchange(exchanges);
	const targets = getCoverageTargets(latestExchange);
	const facet = getPrimaryFacet(targets);
	const domain = getPrimaryDomain(targets);

	if (facet && domain) {
		return `how ${facet} shows up in ${DOMAIN_LABELS[domain] ?? `your ${humanize(domain)}`}`;
	}

	if (facet) {
		return `the pull of ${facet} in you`;
	}

	if (domain) {
		return `what keeps surfacing in ${DOMAIN_LABELS[domain] ?? `your ${humanize(domain)}`}`;
	}

	return normalizeDirectorPhrase(latestExchange?.directorOutput ?? null);
};

const getTopKey = (values: Record<string, number>): string | null => {
	const entries = Object.entries(values).filter(([, value]) => Number.isFinite(value));
	if (entries.length === 0) return null;

	entries.sort((left, right) => right[1] - left[1]);
	return entries[0]?.[0] ?? null;
};

const deriveAssessmentTheme = (assessmentResult: AssessmentResultRecord | null): string | null => {
	if (!assessmentResult) return null;

	const traitScores = Object.fromEntries(
		Object.entries(assessmentResult.traits).flatMap(([trait, value]) =>
			value && typeof value === "object" && "score" in value && typeof value.score === "number"
				? [[trait, value.score]]
				: [],
		),
	);
	const domainScores = Object.fromEntries(
		Object.entries(assessmentResult.domainCoverage).filter(([, value]) => typeof value === "number"),
	);

	const dominantTrait = getTopKey(traitScores);
	const dominantDomain = getTopKey(domainScores);

	if (dominantTrait && dominantDomain) {
		return `how your ${humanize(dominantTrait)} keeps shaping ${DOMAIN_LABELS[dominantDomain] ?? `your ${humanize(dominantDomain)}`}`;
	}

	if (dominantTrait) {
		return `the way your ${humanize(dominantTrait)} keeps steering you`;
	}

	if (dominantDomain) {
		return `what keeps surfacing in ${DOMAIN_LABELS[dominantDomain] ?? `your ${humanize(dominantDomain)}`}`;
	}

	return null;
};

export const deriveDropOffTopic = (exchanges: readonly ExchangeRecord[]): string =>
	deriveExchangePhrase(exchanges) ?? GENERIC_DROP_OFF_TOPIC;

export const deriveCheckInTheme = (
	exchanges: readonly ExchangeRecord[],
	assessmentResult: AssessmentResultRecord | null,
): string =>
	deriveExchangePhrase(exchanges) ??
	deriveAssessmentTheme(assessmentResult) ??
	GENERIC_CHECK_IN_THEME;
