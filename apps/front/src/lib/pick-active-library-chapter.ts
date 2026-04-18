export type LibraryScrollSpyViewport = {
	readonly viewportHeight: number;
	readonly scrollY: number;
	readonly scrollHeight: number;
};

function getEffectiveAnchorOffsetPx(
	anchorOffsetPx: number,
	viewport?: LibraryScrollSpyViewport,
): number {
	if (!viewport || viewport.viewportHeight <= 0 || viewport.scrollHeight <= 0) {
		return anchorOffsetPx;
	}

	const remainingScrollPx = Math.max(
		0,
		viewport.scrollHeight - (viewport.scrollY + viewport.viewportHeight),
	);
	const bottomZonePx = Math.max(anchorOffsetPx * 2, Math.round(viewport.viewportHeight * 0.45));

	if (remainingScrollPx > bottomZonePx) {
		return anchorOffsetPx;
	}

	const lowerAnchorPx = Math.max(anchorOffsetPx, viewport.viewportHeight - anchorOffsetPx);
	const bottomProgress = 1 - remainingScrollPx / bottomZonePx;

	return Math.round(anchorOffsetPx + (lowerAnchorPx - anchorOffsetPx) * bottomProgress);
}

/**
 * Pick the reading-rail chapter that should read as current for scroll-spy.
 *
 * The caller supplies chapter ids in rail order, but this function derives the
 * active order from measured DOM position. That keeps generated rails resilient
 * when an article mixes bespoke sections with MDX headings. Near the bottom of a
 * short article, the activation line gradually moves down the viewport because
 * later headings may never physically reach the sticky-nav offset.
 */
export function pickActiveLibraryChapterId(
	chapterIds: readonly string[],
	getTop: (id: string) => number | null,
	anchorOffsetPx: number,
	viewport?: LibraryScrollSpyViewport,
	preferredId?: string | null,
): string | null {
	if (chapterIds.length === 0) {
		return null;
	}

	const tolerancePx = 8;
	let firstMeasuredId: string | null = null;
	const measurements: Array<{ id: string; top: number }> = [];
	const chapterOrder = new Map(chapterIds.map((id, index) => [id, index]));

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

	if (preferredId && chapterOrder.has(preferredId) && viewport) {
		const preferred = measurements.find(({ id }) => id === preferredId);
		if (
			preferred &&
			preferred.top >= -tolerancePx &&
			preferred.top <= viewport.viewportHeight + tolerancePx
		) {
			return preferred.id;
		}
	}

	measurements.sort((left, right) => {
		const topDelta = left.top - right.top;
		if (topDelta !== 0) {
			return topDelta;
		}
		return (chapterOrder.get(left.id) ?? 0) - (chapterOrder.get(right.id) ?? 0);
	});

	const effectiveAnchorOffsetPx = getEffectiveAnchorOffsetPx(anchorOffsetPx, viewport);
	let lastPassedId: string | null = null;
	for (const { id, top } of measurements) {
		if (top <= effectiveAnchorOffsetPx + tolerancePx) {
			lastPassedId = id;
		} else {
			break;
		}
	}

	return lastPassedId ?? firstMeasuredId;
}
