import type { Meta, StoryObj } from "@storybook/react-vite";

const SEMANTIC_TOKENS = [
	{ label: "Background", var: "--background" },
	{ label: "Foreground", var: "--foreground" },
	{ label: "Card", var: "--card" },
	{ label: "Card Foreground", var: "--card-foreground" },
	{ label: "Popover", var: "--popover" },
	{ label: "Popover Foreground", var: "--popover-foreground" },
	{ label: "Primary", var: "--primary" },
	{ label: "Primary Hover", var: "--primary-hover" },
	{ label: "Primary Foreground", var: "--primary-foreground" },
	{ label: "Secondary", var: "--secondary" },
	{ label: "Secondary Foreground", var: "--secondary-foreground" },
	{ label: "Tertiary", var: "--tertiary" },
	{ label: "Tertiary Foreground", var: "--tertiary-foreground" },
	{ label: "Accent", var: "--accent" },
	{ label: "Accent Foreground", var: "--accent-foreground" },
	{ label: "Muted", var: "--muted" },
	{ label: "Muted Foreground", var: "--muted-foreground" },
	{ label: "Destructive", var: "--destructive" },
	{ label: "Destructive Foreground", var: "--destructive-foreground" },
	{ label: "Success", var: "--success" },
	{ label: "Warning", var: "--warning" },
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
	{ label: "Celebration", var: "--gradient-celebration" },
	{ label: "Progress", var: "--gradient-progress" },
	{ label: "Surface Glow", var: "--gradient-surface-glow" },
	{ label: "Trait Gradient: Openness", var: "--gradient-trait-openness" },
	{
		label: "Trait Gradient: Conscientiousness",
		var: "--gradient-trait-conscientiousness",
	},
	{ label: "Trait Gradient: Extraversion", var: "--gradient-trait-extraversion" },
	{ label: "Trait Gradient: Agreeableness", var: "--gradient-trait-agreeableness" },
	{ label: "Trait Gradient: Neuroticism", var: "--gradient-trait-neuroticism" },
] as const;

const SPACING_TOKENS = [
	{ label: "Space 1 (4px)", var: "--space-1" },
	{ label: "Space 2 (8px)", var: "--space-2" },
	{ label: "Space 3 (12px)", var: "--space-3" },
	{ label: "Space 4 (16px)", var: "--space-4" },
	{ label: "Space 6 (24px)", var: "--space-6" },
	{ label: "Space 8 (32px)", var: "--space-8" },
	{ label: "Space 12 (48px)", var: "--space-12" },
	{ label: "Space 16 (64px)", var: "--space-16" },
	{ label: "Space 24 (96px)", var: "--space-24" },
] as const;

const RADIUS_TOKENS = [
	{ label: "Button (12px)", var: "--radius-button" },
	{ label: "Input (12px)", var: "--radius-input" },
	{ label: "Card (16px)", var: "--radius-card" },
	{ label: "Dialog (24px)", var: "--radius-dialog" },
	{ label: "Hero (32px)", var: "--radius-hero" },
	{ label: "Full (9999px)", var: "--radius-full" },
	{ label: "Chat Bubble (16px)", var: "--radius-chat-bubble" },
	{ label: "Chat Sender (4px)", var: "--radius-chat-sender" },
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

function SpacingBar({ label, cssVar }: { label: string; cssVar: string }) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
			<div
				style={{
					width: `var(${cssVar})`,
					height: 24,
					borderRadius: 4,
					backgroundColor: "var(--primary)",
					opacity: 0.6,
					flexShrink: 0,
					minWidth: 4,
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

function RadiusBox({ label, cssVar }: { label: string; cssVar: string }) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
			<div
				style={{
					width: 48,
					height: 48,
					borderRadius: `var(${cssVar})`,
					border: "2px solid var(--primary)",
					backgroundColor: "var(--card)",
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
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
				{title}
			</h2>
			{children}
		</section>
	);
}

function ColorPalette({ mode }: { mode: "light" | "dark" }) {
	const title = mode === "light" ? "Psychedelic Celebration (Light)" : "Abyss Deep-Ocean (Dark)";

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
					? "Electric Pink, Vivid Orange, Saturated Teal — bold, warm, psychedelic"
					: "Saturated Teal, Rich Gold, Hot Pink on Abyss Navy — the deep ocean at night"}
			</p>

			<Section title="Core Semantic Tokens">
				<SwatchGrid tokens={SEMANTIC_TOKENS} />
			</Section>

			<Section title="Chart Palette">
				<SwatchGrid tokens={CHART_TOKENS} />
			</Section>

			<Section title="Big Five Trait Tokens">
				<SwatchGrid tokens={TRAIT_TOKENS} />
			</Section>

			<Section title="Big Five Facet Tokens">
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
			</Section>

			<Section title="Sidebar Tokens">
				<SwatchGrid tokens={SIDEBAR_TOKENS} />
			</Section>

			<Section title="Gradients">
				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					{GRADIENT_TOKENS.map((token) => (
						<GradientBand key={token.var} label={token.label} cssVar={token.var} />
					))}
				</div>
			</Section>

			<Section title="Spacing Scale">
				<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					{SPACING_TOKENS.map((token) => (
						<SpacingBar key={token.var} label={token.label} cssVar={token.var} />
					))}
				</div>
			</Section>

			<Section title="Radius Scale">
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
						gap: 16,
					}}
				>
					{RADIUS_TOKENS.map((token) => (
						<RadiusBox key={token.var} label={token.label} cssVar={token.var} />
					))}
				</div>
			</Section>
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

export const PsychedelicCelebrationLight: Story = {
	name: "Psychedelic Celebration (Light)",
	args: {
		mode: "light",
	},
};

export const AbyssDeepOceanDark: Story = {
	name: "Abyss Deep-Ocean (Dark)",
	args: {
		mode: "dark",
	},
};
