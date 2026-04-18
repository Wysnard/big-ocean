/**
 * Pick the reading-rail chapter that should read as “current” for scroll-spy.
 *
 * Walks `chapterIds` in **document order** (must match scroll order). The active
 * id is the **last** section whose top edge has reached the anchor line
 * (`anchorOffsetPx` from the top of the viewport), or the first id when none have
 * yet crossed that line.
 */
export function pickActiveLibraryChapterId(
	chapterIds: readonly string[],
	getTop: (id: string) => number | null,
	anchorOffsetPx: number,
): string | null {
	if (chapterIds.length === 0) {
		return null;
	}

	const tolerancePx = 6;
	let firstMeasuredId: string | null = null;
	const measurements: Array<{ id: string; top: number }> = [];

	for (const id of chapterIds) {
		const top = getTop(id);
		if (top === null) {
			continue;
		}
		if (firstMeasuredId === null) {
			firstMeasuredId = id;
		}
		measurements.push({ id, top });
	}

	if (measurements.length === 0) {
		return null;
	}

	const anchorSnapBandPx = Math.max(tolerancePx, Math.round(anchorOffsetPx * 0.4));
	const closestToAnchor = measurements
		.filter(
			({ top }) =>
				top >= anchorOffsetPx - anchorSnapBandPx && top <= anchorOffsetPx + anchorSnapBandPx,
		)
		.sort(
			(left, right) => Math.abs(left.top - anchorOffsetPx) - Math.abs(right.top - anchorOffsetPx),
		)[0];
	if (closestToAnchor) {
		return closestToAnchor.id;
	}

	let lastPassedId: string | null = null;
	for (const { id, top } of measurements) {
		if (top <= anchorOffsetPx + tolerancePx) {
			lastPassedId = id;
		} else {
			break;
		}
	}

	return lastPassedId ?? firstMeasuredId;
}
