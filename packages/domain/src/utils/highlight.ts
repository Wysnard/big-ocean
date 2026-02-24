/**
 * Highlight Position Computation
 *
 * Pure domain function that computes character-level highlight ranges
 * for evidence quotes within message content. Server-side only —
 * the LLM does NOT output highlight positions.
 *
 * Story 11.2
 */

/**
 * Compute highlight start/end positions for a quote within message content.
 *
 * - Exact unique match: returns { highlightStart, highlightEnd }
 * - Multiple matches: returns null (ambiguous)
 * - No match: returns null (graceful degradation)
 * - Empty inputs: returns null
 */
export function computeHighlightPositions(
	messageContent: string,
	quote: string,
): { highlightStart: number | null; highlightEnd: number | null } {
	if (!messageContent || !quote) {
		return { highlightStart: null, highlightEnd: null };
	}

	const firstIndex = messageContent.indexOf(quote);
	if (firstIndex === -1) {
		return { highlightStart: null, highlightEnd: null };
	}

	// Check for multiple matches (ambiguous)
	const secondIndex = messageContent.indexOf(quote, firstIndex + 1);
	if (secondIndex !== -1) {
		return { highlightStart: null, highlightEnd: null };
	}

	return {
		highlightStart: firstIndex,
		highlightEnd: firstIndex + quote.length,
	};
}
