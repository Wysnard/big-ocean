/**
 * ArchetypeCardTemplate — Satori-compatible React component
 *
 * Renders the archetype card as JSX with inline styles (Satori requirement).
 * Used by the Satori API route for PNG generation AND directly in Storybook.
 *
 * Supports two modes:
 * 1. **Personalized** — pass `traitScores` and `dominantColor` for per-user cards
 * 2. **Archetype-generic** — pass `archetypeColor` for static archetype cards (81 total).
 *    Shape sizes are derived from OCEAN code letters using TRAIT_LETTER_MAP sizing.
 *
 * Design tokens mirror Big Ocean design system:
 * - Background: #0a0a0f (depth-surface)
 * - Trait colors from domain constants
 */

const TRAIT_COLORS: Record<string, string> = {
	openness: "#A855F7",
	conscientiousness: "#FF6B2B",
	extraversion: "#FF0080",
	agreeableness: "#00B4A6",
	neuroticism: "#1c1c9c",
};

const TRAIT_ORDER = [
	"openness",
	"conscientiousness",
	"extraversion",
	"agreeableness",
	"neuroticism",
];

/**
 * Maps OCEAN code letters to size multipliers (0-1 range).
 * Low letters = 0.33, Mid = 0.66, High = 1.0
 */
const LETTER_SIZE_MAP: Record<string, number> = {
	// Openness
	T: 0.33,
	M: 0.66,
	O: 1.0,
	// Conscientiousness
	F: 0.33,
	S: 0.66,
	C: 1.0,
	// Extraversion
	R: 0.33,
	B: 0.66,
	E: 1.0,
	// Agreeableness
	D: 0.33,
	P: 0.66,
	A: 1.0,
	// Neuroticism
	// R already mapped (0.33) — same value
	// T already mapped (0.33) — collision, but T is neuroticism mid (0.66). Last write wins.
	N: 1.0,
};
// Fix collisions: apply neuroticism letters last (same order as TRAIT_LETTER_MAP iteration)
// T is Openness low (0.33) but also Neuroticism mid (0.66) — neuroticism wins
// R is Extraversion low (0.33) and also Neuroticism low (0.33) — no conflict
LETTER_SIZE_MAP["T"] = 0.66; // Neuroticism "Tempered" (mid) overwrites Openness "Traditional" (low)

export interface ArchetypeCardTemplateProps {
	archetypeName: string;
	oceanCode: string;
	/** User display name for personalized cards. Null for generic archetype cards. */
	displayName?: string | null;
	/** Short description (1-2 sentences) for archetype-generic cards. */
	description?: string | null;
	/** Per-trait scores (0-120). When provided, shapes are sized by score. */
	traitScores?: Record<string, number>;
	/** Dominant trait color hex. Required for personalized mode. */
	dominantColor?: string;
	/** Archetype color hex from CURATED_ARCHETYPES. Used for generic mode. */
	archetypeColor?: string;
	width: number;
	height: number;
}

/** Get shape size from OCEAN code letter (for generic mode) */
function getShapeSizeFromLetter(letter: string, baseSize: number, maxExtra: number): number {
	const multiplier = LETTER_SIZE_MAP[letter] ?? 0.66;
	return baseSize + multiplier * maxExtra;
}

export function ArchetypeCardTemplate({
	archetypeName,
	oceanCode,
	displayName,
	description,
	traitScores,
	dominantColor,
	archetypeColor,
	width,
	height,
}: ArchetypeCardTemplateProps) {
	const isStory = height > width;
	const isOg = width === 1200 && height === 630;
	const oceanLetters = oceanCode.split("").slice(0, 5);
	const effectiveDominantColor = dominantColor ?? archetypeColor ?? TRAIT_COLORS.openness!;

	// In generic mode (no displayName), show "PERSONALITY ARCHETYPE"
	const displayLabel = displayName
		? `${displayName.toUpperCase()}'S PERSONALITY`
		: "PERSONALITY ARCHETYPE";

	const nameSize = isOg ? 56 : isStory ? 96 : 72;
	const codeSize = isOg ? 40 : isStory ? 72 : 56;
	const labelSize = isOg ? 18 : isStory ? 28 : 22;
	const descSize = isOg ? 18 : isStory ? 28 : 22;
	const gap = isOg ? 20 : isStory ? 48 : 32;
	const shapeBaseSize = isOg ? 14 : isStory ? 24 : 20;
	const shapeMaxExtra = isOg ? 22 : isStory ? 40 : 32;

	return (
		<div
			style={{
				width: `${width}px`,
				height: `${height}px`,
				background: "#0a0a0f",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* Decorative circles */}
			<div
				style={{
					position: "absolute",
					top: "-100px",
					right: "-100px",
					width: isOg ? "300px" : isStory ? "500px" : "400px",
					height: isOg ? "300px" : isStory ? "500px" : "400px",
					borderRadius: "50%",
					background: effectiveDominantColor,
					opacity: 0.15,
				}}
			/>
			{(isStory || isOg) && (
				<div
					style={{
						position: "absolute",
						bottom: "-80px",
						left: "-80px",
						width: isOg ? "200px" : "350px",
						height: isOg ? "200px" : "350px",
						borderRadius: "50%",
						background: effectiveDominantColor,
						opacity: 0.08,
					}}
				/>
			)}

			{/* Content */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: `${gap}px`,
					zIndex: 1,
					padding: isOg ? "0 60px" : "0 40px",
				}}
			>
				{/* Label */}
				<div
					style={{
						color: "rgba(255,255,255,0.5)",
						fontSize: `${labelSize}px`,
						fontWeight: 700,
						letterSpacing: "6px",
					}}
				>
					{displayLabel}
				</div>

				{/* Archetype name */}
				<div
					style={{
						color: "white",
						fontSize: `${nameSize}px`,
						fontWeight: 700,
						textAlign: "center",
						maxWidth: isOg ? "1000px" : "900px",
						lineHeight: 1.1,
					}}
				>
					{archetypeName}
				</div>

				{/* Description (archetype-generic mode only) */}
				{description && (
					<div
						style={{
							color: "rgba(255,255,255,0.6)",
							fontSize: `${descSize}px`,
							fontWeight: 400,
							textAlign: "center",
							maxWidth: isOg ? "900px" : "800px",
							lineHeight: 1.4,
						}}
					>
						{description}
					</div>
				)}

				{/* OCEAN code letters */}
				<div style={{ display: "flex", gap: isOg ? "16px" : isStory ? "32px" : "24px" }}>
					{oceanLetters.map((letter, i) => (
						<div
							key={TRAIT_ORDER[i]}
							style={{
								color: TRAIT_COLORS[TRAIT_ORDER[i] ?? "openness"] ?? "#ffffff",
								fontSize: `${codeSize}px`,
								fontWeight: 700,
								fontFamily: "monospace",
								letterSpacing: "8px",
							}}
						>
							{letter}
						</div>
					))}
				</div>

				{/* Geometric shapes row — uses SVG elements for Satori compatibility */}
				<div
					style={{
						display: "flex",
						gap: isOg ? "14px" : isStory ? "24px" : "20px",
						marginTop: isOg ? "8px" : "16px",
						alignItems: "center",
					}}
				>
					{TRAIT_ORDER.map((trait, i) => {
						const size = traitScores
							? shapeBaseSize + ((traitScores[trait] ?? 60) / 120) * shapeMaxExtra
							: getShapeSizeFromLetter(oceanLetters[i] ?? "", shapeBaseSize, shapeMaxExtra);
						const color = TRAIT_COLORS[trait] ?? "#ffffff";

						if (i === 0) {
							// Circle (Openness) — SVG path
							return (
								<svg key={trait} width={size} height={size} viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="10" fill={color} />
								</svg>
							);
						}
						if (i === 4) {
							// Diamond (Neuroticism) — SVG polygon, no CSS transform
							return (
								<svg key={trait} width={size} height={size} viewBox="0 0 24 24">
									<polygon points="12,1 23,12 12,23 1,12" fill={color} />
								</svg>
							);
						}
						if (i === 3) {
							// Triangle (Agreeableness) — SVG polygon
							return (
								<svg key={trait} width={size} height={size} viewBox="0 0 24 24">
									<polygon points="12,2 22,22 2,22" fill={color} />
								</svg>
							);
						}
						if (i === 1) {
							// Half-circle / arch (Conscientiousness) — SVG path
							return (
								<svg key={trait} width={size} height={size} viewBox="0 0 24 24">
									<path d="M2,24 L2,12 A10,10 0 0,1 22,12 L22,24 Z" fill={color} />
								</svg>
							);
						}
						// Rectangle (Extraversion)
						return (
							<svg key={trait} width={size} height={size * 0.7} viewBox="0 0 24 17">
								<rect x="0" y="0" width="24" height="17" rx="2" fill={color} />
							</svg>
						);
					})}
				</div>

				{/* Wordmark */}
				<div
					style={{
						color: "rgba(255,255,255,0.3)",
						fontSize: isOg ? "16px" : isStory ? "24px" : "20px",
						letterSpacing: "4px",
						marginTop: isOg ? "20px" : isStory ? "64px" : "40px",
					}}
				>
					big-ocean
				</div>
			</div>
		</div>
	);
}
