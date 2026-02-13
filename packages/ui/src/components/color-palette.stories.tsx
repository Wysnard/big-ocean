import type { Meta, StoryObj } from "@storybook/react-vite";

const SEMANTIC_TOKENS = [
	{ label: "Background", var: "--background" },
	{ label: "Foreground", var: "--foreground" },
	{ label: "Card", var: "--card" },
	{ label: "Card Foreground", var: "--card-foreground" },
	{ label: "Popover", var: "--popover" },
	{ label: "Popover Foreground", var: "--popover-foreground" },
	{ label: "Primary", var: "--primary" },
	{ label: "Primary Foreground", var: "--primary-foreground" },
	{ label: "Secondary", var: "--secondary" },
	{ label: "Secondary Foreground", var: "--secondary-foreground" },
	{ label: "Accent", var: "--accent" },
	{ label: "Accent Foreground", var: "--accent-foreground" },
	{ label: "Muted", var: "--muted" },
	{ label: "Muted Foreground", var: "--muted-foreground" },
	{ label: "Destructive", var: "--destructive" },
	{ label: "Destructive Foreground", var: "--destructive-foreground" },
	{ label: "Border", var: "--border" },
	{ label: "Input", var: "--input" },
	{ label: "Ring", var: "--ring" },
] as const;

const CHART_TOKENS = [
	{ label: "Chart 1", var: "--chart-1" },
	{ label: "Chart 2", var: "--chart-2" },
	{ label: "Chart 3", var: "--chart-3" },
	{ label: "Chart 4", var: "--chart-4" },
	{ label: "Chart 5", var: "--chart-5" },
] as const;

const TRAIT_TOKENS = [
	{ label: "Openness", var: "--trait-openness" },
	{ label: "Conscientiousness", var: "--trait-conscientiousness" },
	{ label: "Extraversion", var: "--trait-extraversion" },
	{ label: "Agreeableness", var: "--trait-agreeableness" },
	{ label: "Neuroticism", var: "--trait-neuroticism" },
] as const;

const FACET_TOKEN_GROUPS = [
	{
		title: "Openness Facets",
		tokens: [
			{ label: "Imagination", var: "--facet-imagination" },
			{ label: "Artistic Interests", var: "--facet-artistic_interests" },
			{ label: "Emotionality", var: "--facet-emotionality" },
			{ label: "Adventurousness", var: "--facet-adventurousness" },
			{ label: "Intellect", var: "--facet-intellect" },
			{ label: "Liberalism", var: "--facet-liberalism" },
		],
	},
	{
		title: "Conscientiousness Facets",
		tokens: [
			{ label: "Self Efficacy", var: "--facet-self_efficacy" },
			{ label: "Orderliness", var: "--facet-orderliness" },
			{ label: "Dutifulness", var: "--facet-dutifulness" },
			{ label: "Achievement Striving", var: "--facet-achievement_striving" },
			{ label: "Self Discipline", var: "--facet-self_discipline" },
			{ label: "Cautiousness", var: "--facet-cautiousness" },
		],
	},
	{
		title: "Extraversion Facets",
		tokens: [
			{ label: "Friendliness", var: "--facet-friendliness" },
			{ label: "Gregariousness", var: "--facet-gregariousness" },
			{ label: "Assertiveness", var: "--facet-assertiveness" },
			{ label: "Activity Level", var: "--facet-activity_level" },
			{ label: "Excitement Seeking", var: "--facet-excitement_seeking" },
			{ label: "Cheerfulness", var: "--facet-cheerfulness" },
		],
	},
	{
		title: "Agreeableness Facets",
		tokens: [
			{ label: "Trust", var: "--facet-trust" },
			{ label: "Morality", var: "--facet-morality" },
			{ label: "Altruism", var: "--facet-altruism" },
			{ label: "Cooperation", var: "--facet-cooperation" },
			{ label: "Modesty", var: "--facet-modesty" },
			{ label: "Sympathy", var: "--facet-sympathy" },
		],
	},
	{
		title: "Neuroticism Facets",
		tokens: [
			{ label: "Anxiety", var: "--facet-anxiety" },
			{ label: "Anger", var: "--facet-anger" },
			{ label: "Depression", var: "--facet-depression" },
			{ label: "Self Consciousness", var: "--facet-self_consciousness" },
			{ label: "Immoderation", var: "--facet-immoderation" },
			{ label: "Vulnerability", var: "--facet-vulnerability" },
		],
	},
] as const;

const SIDEBAR_TOKENS = [
	{ label: "Sidebar", var: "--sidebar" },
	{ label: "Sidebar Foreground", var: "--sidebar-foreground" },
	{ label: "Sidebar Primary", var: "--sidebar-primary" },
	{ label: "Sidebar Primary FG", var: "--sidebar-primary-foreground" },
	{ label: "Sidebar Accent", var: "--sidebar-accent" },
	{ label: "Sidebar Accent FG", var: "--sidebar-accent-foreground" },
	{ label: "Sidebar Border", var: "--sidebar-border" },
	{ label: "Sidebar Ring", var: "--sidebar-ring" },
] as const;

const GRADIENT_TOKENS = [
	{ label: "Ocean Gradient", var: "--gradient-ocean" },
	{ label: "Ocean Subtle", var: "--gradient-ocean-subtle" },
	{ label: "Ocean Radial", var: "--gradient-ocean-radial" },
	{ label: "Trait Gradient: Openness", var: "--gradient-trait-openness" },
	{
		label: "Trait Gradient: Conscientiousness",
		var: "--gradient-trait-conscientiousness",
	},
	{ label: "Trait Gradient: Extraversion", var: "--gradient-trait-extraversion" },
	{ label: "Trait Gradient: Agreeableness", var: "--gradient-trait-agreeableness" },
	{ label: "Trait Gradient: Neuroticism", var: "--gradient-trait-neuroticism" },
] as const;

function Swatch({ label, cssVar }: { label: string; cssVar: string }) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
			<div
				style={{
					width: 48,
					height: 48,
					borderRadius: 8,
					backgroundColor: `var(${cssVar})`,
					border: "1px solid var(--border)",
					flexShrink: 0,
				}}
			/>
			<div>
				<div style={{ fontWeight: 600, fontSize: 13, color: "var(--foreground)" }}>{label}</div>
				<div
					style={{
						fontSize: 11,
						fontFamily: "monospace",
						color: "var(--muted-foreground)",
					}}
				>
					{cssVar}
				</div>
			</div>
		</div>
	);
}

function GradientBand({ label, cssVar }: { label: string; cssVar: string }) {
	return (
		<div>
			<div
				style={{
					fontWeight: 600,
					fontSize: 13,
					marginBottom: 6,
					color: "var(--foreground)",
				}}
			>
				{label}
			</div>
			<div
				style={{
					width: "100%",
					height: 64,
					borderRadius: 12,
					backgroundImage: `var(${cssVar})`,
					border: "1px solid var(--border)",
				}}
			/>
			<div
				style={{
					fontSize: 11,
					fontFamily: "monospace",
					marginTop: 4,
					color: "var(--muted-foreground)",
				}}
			>
				{cssVar}
			</div>
		</div>
	);
}

function SwatchGrid({ tokens }: { tokens: ReadonlyArray<{ label: string; var: string }> }) {
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
				gap: 16,
			}}
		>
			{tokens.map((token) => (
				<Swatch key={token.var} label={token.label} cssVar={token.var} />
			))}
		</div>
	);
}

function ColorPalette({ mode }: { mode: "light" | "dark" }) {
	const title = mode === "light" ? "Coral Reef (Light Mode)" : "Moonlit Navy (Dark Mode)";

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
					marginBottom: 8,
				}}
			>
				{title}
			</h1>
			<p
				style={{
					fontSize: 14,
					color: "var(--muted-foreground)",
					marginBottom: 32,
				}}
			>
				{mode === "light"
					? "Saturated coral-pink, ocean teal, and vivid orange — a coral reef in sunlight"
					: "Saturated navy with teal-blue and golden moonlight — the ocean after sunset"}
			</p>

			<section style={{ marginBottom: 32 }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						marginBottom: 16,
						borderBottom: "1px solid var(--border)",
						paddingBottom: 8,
					}}
				>
					Core Semantic Tokens
				</h2>
				<SwatchGrid tokens={SEMANTIC_TOKENS} />
			</section>

			<section style={{ marginBottom: 32 }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						marginBottom: 16,
						borderBottom: "1px solid var(--border)",
						paddingBottom: 8,
					}}
				>
					Chart Palette
				</h2>
				<SwatchGrid tokens={CHART_TOKENS} />
			</section>

			<section style={{ marginBottom: 32 }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						marginBottom: 16,
						borderBottom: "1px solid var(--border)",
						paddingBottom: 8,
					}}
				>
					Big Five Trait Tokens
				</h2>
				<SwatchGrid tokens={TRAIT_TOKENS} />
			</section>

			<section style={{ marginBottom: 32 }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						marginBottom: 16,
						borderBottom: "1px solid var(--border)",
						paddingBottom: 8,
					}}
				>
					Big Five Facet Tokens
				</h2>
				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					{FACET_TOKEN_GROUPS.map((group) => (
						<div key={group.title}>
							<h3
								style={{
									fontSize: 13,
									fontWeight: 600,
									marginBottom: 10,
									color: "var(--muted-foreground)",
								}}
							>
								{group.title}
							</h3>
							<SwatchGrid tokens={group.tokens} />
						</div>
					))}
				</div>
			</section>

			<section style={{ marginBottom: 32 }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						marginBottom: 16,
						borderBottom: "1px solid var(--border)",
						paddingBottom: 8,
					}}
				>
					Sidebar Tokens
				</h2>
				<SwatchGrid tokens={SIDEBAR_TOKENS} />
			</section>

			<section>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						marginBottom: 16,
						borderBottom: "1px solid var(--border)",
						paddingBottom: 8,
					}}
				>
					Gradients
				</h2>
				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					{GRADIENT_TOKENS.map((token) => (
						<GradientBand key={token.var} label={token.label} cssVar={token.var} />
					))}
				</div>
			</section>
		</div>
	);
}

const meta = {
	title: "Theme/Color Palette",
	component: ColorPalette,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CoralReefLight: Story = {
	name: "Coral Reef (Light)",
	args: {
		mode: "light",
	},
};

export const MoonlitNavyDark: Story = {
	name: "Moonlit Navy (Dark)",
	args: {
		mode: "dark",
	},
};
