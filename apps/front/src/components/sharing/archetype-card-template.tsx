/**
 * ArchetypeCardTemplate — Satori-compatible React component
 *
 * Renders the archetype card as JSX with inline styles (Satori requirement).
 * Used by the Satori API route for PNG generation AND directly in Storybook.
 *
 * Supports two modes:
 * 1. **Personalized** — pass `traitScores` and `dominantColor` for per-user cards
 * 2. **Archetype-generic** — pass `archetypeColor` for static archetype cards (81 total).
 *    Each OCEAN code letter renders its own unique inline SVG shape.
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
 * Renders the correct inline SVG shape for a given OCEAN code letter.
 * All shapes use SVG path/polygon only — no CSS transforms (Satori requirement).
 */
function renderLetterShape(
	letter: string,
	size: number,
	color: string,
	key: string,
): React.ReactNode {
	switch (letter) {
		// Openness
		case "O": // High — Full circle
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="12" cy="12" r="10" fill={color} />
				</svg>
			);
		case "M": // Mid — Square with inverted triangle cut
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M2 2h20v20H2z M12 2L6 14h12z" fill={color} fillRule="evenodd" />
				</svg>
			);
		case "T": // Low — Equilateral cross upright
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" fill={color} />
				</svg>
			);

		// Conscientiousness
		case "C": // High — Half-circle (flat edge)
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M18 2 A10 10 0 0 0 18 22 Z" fill={color} />
				</svg>
			);
		case "S": // Mid — Two quarter-circles facing outward
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M2 2v10A10 10 0 0 0 12 2z" fill={color} />
					<path d="M22 22V12A10 10 0 0 0 12 22z" fill={color} />
				</svg>
			);
		case "F": // Low — Three-quarter square
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M2 2h20v4H6v14h18v4H2z" fill={color} />
				</svg>
			);

		// Extraversion
		case "E": // High — Tall rectangle
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<rect x="7" y="2" width="10" height="20" rx="1" fill={color} />
				</svg>
			);
		case "B": // Mid — Quarter-circle
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M2 2v20A20 20 0 0 0 22 2z" fill={color} />
				</svg>
			);
		case "I": // Low — Vertical ellipse
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<ellipse cx="12" cy="12" rx="6" ry="10" fill={color} />
				</svg>
			);

		// Agreeableness
		case "A": // High — Equilateral triangle
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<polygon points="12,2 22,22 2,22" fill={color} />
				</svg>
			);
		case "P": // Mid — Square on one stick (lollipop)
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<rect x="5" y="2" width="14" height="14" fill={color} />
					<rect x="10" y="16" width="4" height="6" fill={color} />
				</svg>
			);
		case "D": // Low — Half-circle reversed
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M6 2 A10 10 0 0 1 6 22 Z" fill={color} />
				</svg>
			);

		// Neuroticism
		case "N": // High — Diamond
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<polygon points="12,1 23,12 12,23 1,12" fill={color} />
				</svg>
			);
		case "V": // Mid — Inverted triangle
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<polygon points="2,2 22,2 12,22" fill={color} />
				</svg>
			);
		case "R": // Low — Square on two sticks (table)
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<rect x="2" y="2" width="20" height="14" fill={color} />
					<rect x="5" y="16" width="4" height="6" fill={color} />
					<rect x="15" y="16" width="4" height="6" fill={color} />
				</svg>
			);

		// Fallback — circle
		default:
			return (
				<svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="12" cy="12" r="10" fill={color} />
				</svg>
			);
	}
}

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
	const effectiveDominantColor =
		dominantColor ?? archetypeColor ?? TRAIT_COLORS.openness ?? "#A855F7";

	// In generic mode (no displayName), show "PERSONALITY ARCHETYPE"
	const displayLabel = displayName
		? `${displayName.toUpperCase()}'S PERSONALITY`
		: "PERSONALITY ARCHETYPE";

	const nameSize = isOg ? 56 : isStory ? 96 : 72;
	const codeSize = isOg ? 40 : isStory ? 72 : 56;
	const labelSize = isOg ? 18 : isStory ? 28 : 22;
	const descSize = isOg ? 18 : isStory ? 28 : 22;
	const gap = isOg ? 20 : isStory ? 48 : 32;
	const shapeSize = isOg ? 28 : isStory ? 48 : 40;
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
						const letter = oceanLetters[i] ?? "";
						const color = TRAIT_COLORS[trait] ?? "#ffffff";
						const size = traitScores
							? shapeBaseSize + ((traitScores[trait] ?? 60) / 120) * shapeMaxExtra
							: shapeSize;

						return renderLetterShape(letter, size, color, trait);
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
