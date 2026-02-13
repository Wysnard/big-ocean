import type { Meta, StoryObj } from "@storybook/react-vite";

const TYPE_SCALE = [
	{
		token: "display-hero",
		size: "3.5rem (56px)",
		weight: 700,
		lineHeight: "1.05",
		font: "Space Grotesk",
		fontVar: "--font-heading",
		usage: "Archetype name reveal",
	},
	{
		token: "display-xl",
		size: "3rem (48px)",
		weight: 700,
		lineHeight: "1.1",
		font: "Space Grotesk",
		fontVar: "--font-heading",
		usage: "Hero headlines",
	},
	{
		token: "display",
		size: "2.25rem (36px)",
		weight: 700,
		lineHeight: "1.15",
		font: "Space Grotesk",
		fontVar: "--font-heading",
		usage: "Page titles",
	},
	{
		token: "h1",
		size: "1.875rem (30px)",
		weight: 600,
		lineHeight: "1.2",
		font: "Space Grotesk",
		fontVar: "--font-heading",
		usage: "Section headings",
	},
	{
		token: "h2",
		size: "1.5rem (24px)",
		weight: 600,
		lineHeight: "1.25",
		font: "Space Grotesk",
		fontVar: "--font-heading",
		usage: "Subsection headings",
	},
	{
		token: "h3",
		size: "1.25rem (20px)",
		weight: 600,
		lineHeight: "1.3",
		font: "Space Grotesk",
		fontVar: "--font-heading",
		usage: "Card titles, trait names",
	},
	{
		token: "h4",
		size: "1.125rem (18px)",
		weight: 500,
		lineHeight: "1.35",
		font: "Space Grotesk",
		fontVar: "--font-heading",
		usage: "Labels, facet names",
	},
	{
		token: "body",
		size: "1rem (16px)",
		weight: 400,
		lineHeight: "1.6",
		font: "DM Sans",
		fontVar: "--font-body",
		usage: "Body text, chat messages",
	},
	{
		token: "body-sm",
		size: "0.875rem (14px)",
		weight: 400,
		lineHeight: "1.5",
		font: "DM Sans",
		fontVar: "--font-body",
		usage: "Secondary text, captions",
	},
	{
		token: "caption",
		size: "0.75rem (12px)",
		weight: 400,
		lineHeight: "1.4",
		font: "DM Sans",
		fontVar: "--font-body",
		usage: "Fine print, metadata",
	},
	{
		token: "data",
		size: "1rem (16px)",
		weight: 400,
		lineHeight: "1.4",
		font: "JetBrains Mono",
		fontVar: "--font-data",
		usage: "Precision %, scores, OCEAN codes",
	},
] as const;

const FONT_WEIGHT_MAP: Record<number, string> = {
	400: "normal",
	500: "500",
	600: "600",
	700: "bold",
};

function TypeScaleRow({
	token,
	size,
	weight,
	lineHeight,
	font,
	fontVar,
	usage,
}: (typeof TYPE_SCALE)[number]) {
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "140px 1fr 200px",
				gap: 16,
				alignItems: "baseline",
				paddingBlock: 12,
				borderBottom: "1px solid var(--border)",
			}}
		>
			<div>
				<div
					style={{
						fontSize: 11,
						fontFamily: "monospace",
						color: "var(--muted-foreground)",
					}}
				>
					{token}
				</div>
				<div
					style={{
						fontSize: 11,
						color: "var(--muted-foreground)",
						marginTop: 2,
					}}
				>
					{size} · {FONT_WEIGHT_MAP[weight]} · {lineHeight}
				</div>
			</div>
			<div
				style={{
					fontFamily: `var(${fontVar})`,
					fontSize: `var(--text-${token})`,
					fontWeight: weight,
					lineHeight,
					color: "var(--foreground)",
				}}
			>
				{font === "JetBrains Mono" ? "HHMHM 92.3%" : "The Cosmic Navigator"}
			</div>
			<div
				style={{
					fontSize: 12,
					color: "var(--muted-foreground)",
				}}
			>
				{font} · {usage}
			</div>
		</div>
	);
}

function FontSpecimen({
	name,
	fontVar,
	weights,
	sampleText,
}: {
	name: string;
	fontVar: string;
	weights: number[];
	sampleText: string;
}) {
	return (
		<div style={{ marginBottom: 32 }}>
			<h3
				style={{
					fontSize: 14,
					fontWeight: 600,
					marginBottom: 12,
					color: "var(--muted-foreground)",
					borderBottom: "1px solid var(--border)",
					paddingBottom: 8,
				}}
			>
				{name} <span style={{ fontFamily: "monospace", fontWeight: 400 }}>var({fontVar})</span>
			</h3>
			{weights.map((w) => (
				<div
					key={w}
					style={{
						fontFamily: `var(${fontVar})`,
						fontSize: 24,
						fontWeight: w,
						lineHeight: 1.4,
						color: "var(--foreground)",
						marginBottom: 8,
					}}
				>
					{sampleText}{" "}
					<span
						style={{
							fontSize: 12,
							fontWeight: 400,
							color: "var(--muted-foreground)",
							fontFamily: "monospace",
						}}
					>
						weight {w}
					</span>
				</div>
			))}
		</div>
	);
}

function Typography({ mode }: { mode: "light" | "dark" }) {
	return (
		<div
			className={mode === "dark" ? "dark" : ""}
			style={{
				backgroundColor: "var(--background)",
				color: "var(--foreground)",
				padding: 32,
				borderRadius: 16,
				minHeight: "100%",
			}}
		>
			<h1
				style={{
					fontSize: 24,
					fontWeight: 700,
					fontFamily: "var(--font-heading)",
					marginBottom: 8,
				}}
			>
				Typography System
			</h1>
			<p
				style={{
					fontSize: 14,
					color: "var(--muted-foreground)",
					marginBottom: 32,
					fontFamily: "var(--font-body)",
				}}
			>
				Three-font system: Space Grotesk (headings), DM Sans (body), JetBrains Mono (data)
			</p>

			{/* Display Hero Showcase */}
			<section style={{ marginBottom: 48 }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						marginBottom: 16,
						borderBottom: "1px solid var(--border)",
						paddingBottom: 8,
					}}
				>
					Display Hero
				</h2>
				<div
					style={{
						fontFamily: "var(--font-heading)",
						fontSize: "var(--text-display-hero)",
						fontWeight: 700,
						lineHeight: 1.05,
						color: "var(--foreground)",
					}}
				>
					The Cosmic Navigator
				</div>
				<div
					style={{
						fontSize: 12,
						fontFamily: "monospace",
						color: "var(--muted-foreground)",
						marginTop: 8,
					}}
				>
					Space Grotesk · 3.5rem (56px) · weight 700 · line-height 1.05
				</div>
			</section>

			{/* Full Type Scale */}
			<section style={{ marginBottom: 48 }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						marginBottom: 16,
						borderBottom: "1px solid var(--border)",
						paddingBottom: 8,
					}}
				>
					Type Scale
				</h2>
				{TYPE_SCALE.map((entry) => (
					<TypeScaleRow key={entry.token} {...entry} />
				))}
			</section>

			{/* Font Specimens */}
			<section style={{ marginBottom: 48 }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						marginBottom: 16,
						borderBottom: "1px solid var(--border)",
						paddingBottom: 8,
					}}
				>
					Font Specimens
				</h2>
				<FontSpecimen
					name="Space Grotesk"
					fontVar="--font-heading"
					weights={[500, 600, 700]}
					sampleText="Explore Your Inner Ocean"
				/>
				<FontSpecimen
					name="DM Sans"
					fontVar="--font-body"
					weights={[400, 500, 600]}
					sampleText="Let's explore how you think about the world around you."
				/>
				<FontSpecimen
					name="JetBrains Mono"
					fontVar="--font-data"
					weights={[400]}
					sampleText="HHMHM 92.3% 0.847"
				/>
			</section>
		</div>
	);
}

const meta = {
	title: "Theme/Typography",
	component: Typography,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
	name: "Typography (Light)",
	args: {
		mode: "light",
	},
};

export const Dark: Story = {
	name: "Typography (Dark)",
	args: {
		mode: "dark",
	},
};
