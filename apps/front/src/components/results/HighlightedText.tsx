"use client";

/**
 * HighlightedText Component (Story 12.2)
 *
 * Renders text with highlighted ranges using <mark> elements.
 * Handles overlapping ranges by layering semi-transparent backgrounds.
 * Confidence maps to opacity: 0.15 + (confidence / 100) * 0.45.
 */

interface Highlight {
	start: number;
	end: number;
	color: string;
	confidence: number;
}

interface HighlightedTextProps {
	text: string;
	highlights: Highlight[];
}

interface Segment {
	start: number;
	end: number;
	highlights: Highlight[];
}

/**
 * Build non-overlapping segments from highlight ranges.
 * Each segment tracks which highlights cover it, enabling layered rendering.
 */
function buildSegments(text: string, highlights: Highlight[]): Segment[] {
	if (highlights.length === 0) {
		return [{ start: 0, end: text.length, highlights: [] }];
	}

	// Clamp highlights to text bounds
	const clamped = highlights
		.map((h) => ({
			...h,
			start: Math.max(0, h.start),
			end: Math.min(text.length, h.end),
		}))
		.filter((h) => h.start < h.end);

	if (clamped.length === 0) {
		return [{ start: 0, end: text.length, highlights: [] }];
	}

	// Collect all boundary points
	const points = new Set<number>();
	points.add(0);
	points.add(text.length);
	for (const h of clamped) {
		points.add(h.start);
		points.add(h.end);
	}

	const sorted = Array.from(points).sort((a, b) => a - b);

	const segments: Segment[] = [];
	for (let i = 0; i < sorted.length - 1; i++) {
		const segStart = sorted[i];
		const segEnd = sorted[i + 1];
		const covering = clamped.filter((h) => h.start <= segStart && h.end >= segEnd);
		segments.push({ start: segStart, end: segEnd, highlights: covering });
	}

	return segments;
}

function highlightOpacity(confidence: number): number {
	return 0.15 + (confidence / 100) * 0.45;
}

export function HighlightedText({ text, highlights }: HighlightedTextProps) {
	const segments = buildSegments(text, highlights);

	return (
		<span data-testid="highlighted-text">
			{segments.map((seg) => {
				const content = text.slice(seg.start, seg.end);

				if (seg.highlights.length === 0) {
					return <span key={seg.start}>{content}</span>;
				}

				// Layer highlights via nested marks — use background alpha, NOT element opacity
				// (element opacity compounds multiplicatively and makes text unreadable)
				let element = <>{content}</>;
				for (const h of seg.highlights) {
					const alpha = highlightOpacity(h.confidence);
					// Convert hex color + alpha to rgba for semi-transparent background only
					const r = Number.parseInt(h.color.slice(1, 3), 16);
					const g = Number.parseInt(h.color.slice(3, 5), 16);
					const b = Number.parseInt(h.color.slice(5, 7), 16);
					element = (
						<mark
							style={{
								backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
								borderRadius: "2px",
								padding: 0,
							}}
							data-confidence={h.confidence}
						>
							{element}
						</mark>
					);
				}

				return <span key={seg.start}>{element}</span>;
			})}
		</span>
	);
}
