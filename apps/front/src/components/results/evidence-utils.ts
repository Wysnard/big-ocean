/**
 * Shared evidence display utilities (Story 12.2)
 *
 * Extracted from DetailZone.tsx to avoid duplication with EvidencePanel.
 */

const DOMAIN_LABELS: Record<string, string> = {
	work: "Work",
	relationships: "Relationships",
	family: "Family",
	leisure: "Leisure",
	solo: "Solo",
	other: "Other",
};

export function getDomainLabel(domain: string): string {
	return DOMAIN_LABELS[domain] ?? domain;
}

export function formatDeviation(deviation: number): string {
	if (deviation > 0) return `+${deviation}`;
	return String(deviation);
}

export function getSignalBadge(confidence: number): { label: string; className: string } {
	if (confidence >= 70) {
		return {
			label: "Strong",
			className: "bg-[oklch(0.67_0.13_181/0.15)] text-[oklch(0.45_0.13_181)]",
		};
	}
	if (confidence >= 40) {
		return {
			label: "Moderate",
			className: "bg-[oklch(0.67_0.20_42/0.15)] text-[oklch(0.50_0.20_42)]",
		};
	}
	return {
		label: "Weak",
		className: "bg-[oklch(0.29_0.19_272/0.10)] text-[oklch(0.40_0.10_272)]",
	};
}
