/** Matches `UNKNOWN_OCEAN_CODE` in `list-relationship-analyses.use-case` when partner facets are missing. */
export const UNKNOWN_PARTNER_OCEAN_CODE = "?????";

interface LastSharedInput {
	readonly hasContent: boolean;
	readonly createdAt: string;
	readonly contentCompletedAt: string | null;
}

const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
	month: "long",
	year: "numeric",
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const RELATIVE_UNITS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
	["year", 1000 * 60 * 60 * 24 * 365],
	["month", 1000 * 60 * 60 * 24 * 30],
	["week", 1000 * 60 * 60 * 24 * 7],
	["day", 1000 * 60 * 60 * 24],
	["hour", 1000 * 60 * 60],
	["minute", 1000 * 60],
];

export function formatUnderstandingSinceMonthYear(isoDate: string) {
	return monthYearFormatter.format(new Date(isoDate));
}

export function lastSharedIsoForDisplay(input: LastSharedInput) {
	if (!input.hasContent) {
		return null;
	}

	return input.contentCompletedAt ?? input.createdAt;
}

export function formatLastSharedRelative(isoDate: string, nowMs = Date.now()) {
	const timestamp = new Date(isoDate).getTime();
	const diff = timestamp - nowMs;

	for (const [unit, unitMs] of RELATIVE_UNITS) {
		const value = diff / unitMs;
		if (Math.abs(value) >= 1) {
			return relativeFormatter.format(Math.round(value), unit);
		}
	}

	return relativeFormatter.format(0, "minute");
}
