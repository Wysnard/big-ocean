/**
 * ArchetypeCardTemplate — Satori-compatible React component
 *
 * Renders the archetype card as JSX with inline styles (Satori requirement).
 * Used by the Satori API route for PNG generation AND directly in Storybook.
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

export interface ArchetypeCardTemplateProps {
	archetypeName: string;
	oceanCode: string;
	displayName: string | null;
	traitScores: Record<string, number>;
	dominantColor: string;
	width: number;
	height: number;
}

export function ArchetypeCardTemplate({
	archetypeName,
	oceanCode,
	displayName,
	traitScores,
	dominantColor,
	width,
	height,
}: ArchetypeCardTemplateProps) {
	const isStory = height > width;
	const oceanLetters = oceanCode.split("").slice(0, 5);
	const displayLabel = displayName
		? `${displayName.toUpperCase()}'S PERSONALITY`
		: "PERSONALITY ARCHETYPE";

	const nameSize = isStory ? 96 : 72;
	const codeSize = isStory ? 72 : 56;
	const labelSize = isStory ? 28 : 22;
	const gap = isStory ? 48 : 32;
	const shapeBaseSize = isStory ? 24 : 20;
	const shapeMaxExtra = isStory ? 40 : 32;

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
					width: isStory ? "500px" : "400px",
					height: isStory ? "500px" : "400px",
					borderRadius: "50%",
					background: dominantColor,
					opacity: 0.15,
				}}
			/>
			{isStory && (
				<div
					style={{
						position: "absolute",
						bottom: "-80px",
						left: "-80px",
						width: "350px",
						height: "350px",
						borderRadius: "50%",
						background: dominantColor,
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
						maxWidth: "900px",
						lineHeight: 1.1,
					}}
				>
					{archetypeName}
				</div>

				{/* OCEAN code letters */}
				<div style={{ display: "flex", gap: isStory ? "32px" : "24px" }}>
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

				{/* Geometric shapes row */}
				<div
					style={{
						display: "flex",
						gap: isStory ? "24px" : "20px",
						marginTop: "16px",
						alignItems: "center",
					}}
				>
					{TRAIT_ORDER.map((trait, i) => {
						const score = traitScores[trait] ?? 60;
						const size = shapeBaseSize + (score / 120) * shapeMaxExtra;
						const color = TRAIT_COLORS[trait] ?? "#ffffff";

						if (i === 0) {
							// Circle (Openness)
							return (
								<div
									key={trait}
									style={{
										width: `${size}px`,
										height: `${size}px`,
										borderRadius: "50%",
										background: color,
									}}
								/>
							);
						}
						if (i === 4) {
							// Diamond (Neuroticism)
							return (
								<div
									key={trait}
									style={{
										width: `${size}px`,
										height: `${size}px`,
										background: color,
										transform: "rotate(45deg)",
									}}
								/>
							);
						}
						// Rectangle variants
						return (
							<div
								key={trait}
								style={{
									width: `${size}px`,
									height: `${size * (i === 2 ? 0.7 : i === 3 ? 0.85 : 1)}px`,
									background: color,
									borderRadius: i === 1 ? `${size / 2}px ${size / 2}px 0 0` : "3px",
								}}
							/>
						);
					})}
				</div>

				{/* Wordmark */}
				<div
					style={{
						color: "rgba(255,255,255,0.3)",
						fontSize: isStory ? "24px" : "20px",
						letterSpacing: "4px",
						marginTop: isStory ? "64px" : "40px",
					}}
				>
					big-ocean
				</div>
			</div>
		</div>
	);
}
