import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	type FacetName,
	TRAIT_TO_FACETS,
	type TraitName,
} from "@workspace/domain/constants/big-five";
import {
	getFacetColor,
	getTraitAccentColor,
	getTraitColor,
	getTraitGradient,
} from "@workspace/domain/utils/trait-colors";
import {
	OceanCircle,
	OceanDiamond,
	OceanHalfCircle,
	OceanRectangle,
	OceanTriangle,
} from "../ocean-shapes";

// ─── Constants ──────────────────────────────────────────────────

const TRAITS: TraitName[] = [
	"openness",
	"conscientiousness",
	"extraversion",
	"agreeableness",
	"neuroticism",
];

const TRAIT_LABELS: Record<TraitName, string> = {
	openness: "Openness",
	conscientiousness: "Conscientiousness",
	extraversion: "Extraversion",
	agreeableness: "Agreeableness",
	neuroticism: "Neuroticism",
};

const TRAIT_SHAPES: Record<TraitName, React.FC<{ size: number; color: string }>> = {
	openness: OceanCircle,
	conscientiousness: OceanHalfCircle,
	extraversion: OceanRectangle,
	agreeableness: OceanTriangle,
	neuroticism: OceanDiamond,
};

// ─── Swatch Helper ──────────────────────────────────────────────

function Swatch({ color, label, size = 48 }: { color: string; label: string; size?: number }) {
	return (
		<div style={{ textAlign: "center" }}>
			<div
				style={{
					width: size,
					height: size,
					borderRadius: 8,
					background: color,
					border: "1px solid var(--border)",
				}}
			/>
			<div
				style={{
					fontSize: 10,
					marginTop: 4,
					color: "var(--muted-foreground)",
					maxWidth: size + 16,
					wordBreak: "break-all",
				}}
			>
				{label}
			</div>
		</div>
	);
}

// ─── Story 1: Trait Color Swatches ──────────────────────────────

function TraitSwatches() {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
			<h2
				style={{
					fontSize: 18,
					fontWeight: 700,
					fontFamily: "var(--font-heading)",
					color: "var(--foreground)",
				}}
			>
				Big Five Trait Colors
			</h2>
			<div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
				{TRAITS.map((trait) => {
					const Shape = TRAIT_SHAPES[trait];
					return (
						<div
							key={trait}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 8,
								padding: 16,
								borderRadius: 12,
								border: "1px solid var(--border)",
								background: "var(--card)",
								minWidth: 120,
							}}
						>
							<Shape size={40} color={getTraitColor(trait)} />
							<Swatch color={getTraitColor(trait)} label={TRAIT_LABELS[trait]} size={56} />
							<div
								style={{
									fontSize: 10,
									color: "var(--muted-foreground)",
									fontFamily: "var(--font-data)",
								}}
							>
								{getTraitColor(trait)}
							</div>
						</div>
					);
				})}
			</div>
			<p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
				Toggle light/dark mode in the Storybook toolbar to compare both themes. Colors use OKLCH format
				with dark mode using brighter variants.
			</p>
		</div>
	);
}

// ─── Story 2: Facet Color Families ──────────────────────────────

function FacetFamilies() {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
			<h2
				style={{
					fontSize: 18,
					fontWeight: 700,
					fontFamily: "var(--font-heading)",
					color: "var(--foreground)",
				}}
			>
				Facet Color Families (Lightness-Step Algorithm)
			</h2>
			{TRAITS.map((trait) => {
				const facets = TRAIT_TO_FACETS[trait] as readonly FacetName[];
				return (
					<div key={trait}>
						<h3
							style={{
								fontSize: 14,
								fontWeight: 600,
								marginBottom: 12,
								color: getTraitColor(trait),
								fontFamily: "var(--font-heading)",
							}}
						>
							{TRAIT_LABELS[trait]} — 6 facets
						</h3>
						<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
							<Swatch color={getTraitColor(trait)} label={`${trait} (parent)`} size={48} />
							{facets.map((facet) => (
								<Swatch key={facet} color={getFacetColor(facet)} label={facet} size={48} />
							))}
						</div>
					</div>
				);
			})}
			<p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
				Each facet family shares the same hue as its parent trait, with lightness fanning across 6 steps
				(L step=0.05, total span=0.25). Chroma varies slightly for visual interest.
			</p>
		</div>
	);
}

// ─── Story 3: Trait Gradients ───────────────────────────────────

function TraitGradients() {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
			<h2
				style={{
					fontSize: 18,
					fontWeight: 700,
					fontFamily: "var(--font-heading)",
					color: "var(--foreground)",
				}}
			>
				Trait Gradients (Accent Pairs)
			</h2>
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				{TRAITS.map((trait) => (
					<div key={trait} style={{ display: "flex", alignItems: "center", gap: 16 }}>
						<div
							style={{
								width: 200,
								height: 48,
								borderRadius: 12,
								background: getTraitGradient(trait),
								border: "1px solid var(--border)",
							}}
						/>
						<div>
							<div
								style={{
									fontSize: 13,
									fontWeight: 600,
									color: "var(--foreground)",
									fontFamily: "var(--font-heading)",
								}}
							>
								{TRAIT_LABELS[trait]}
							</div>
							<div
								style={{
									fontSize: 10,
									color: "var(--muted-foreground)",
									fontFamily: "var(--font-data)",
								}}
							>
								{getTraitColor(trait)} → {getTraitAccentColor(trait)}
							</div>
						</div>
					</div>
				))}
			</div>
			<p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
				Gradients use <code>var()</code> references so they automatically adapt to light/dark mode.
			</p>
		</div>
	);
}

// ─── Story 4: Colors + Shapes Together ──────────────────────────

function ColorsWithShapes() {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
			<h2
				style={{
					fontSize: 18,
					fontWeight: 700,
					fontFamily: "var(--font-heading)",
					color: "var(--foreground)",
				}}
			>
				Trait Colors with OCEAN Geometric Shapes
			</h2>
			<p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
				Per AC #3: Color is never the sole indicator — each trait is always paired with its unique
				geometric shape and text label.
			</p>
			<div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
				{TRAITS.map((trait) => {
					const Shape = TRAIT_SHAPES[trait];
					return (
						<div
							key={trait}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 12,
								padding: 24,
								borderRadius: 16,
								background: getTraitGradient(trait),
								minWidth: 140,
							}}
						>
							<Shape size={48} color="white" />
							<span
								style={{
									color: "white",
									fontWeight: 700,
									fontSize: 14,
									fontFamily: "var(--font-heading)",
								}}
							>
								{TRAIT_LABELS[trait]}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── Story 5: Contrast Reference ────────────────────────────────

function ContrastReference() {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
			<h2
				style={{
					fontSize: 18,
					fontWeight: 700,
					fontFamily: "var(--font-heading)",
					color: "var(--foreground)",
				}}
			>
				WCAG Contrast Reference
			</h2>
			<p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
				Trait colors as fills/backgrounds with white and dark foreground text. Neuroticism (dark navy in
				light mode) works best with white text overlay. All traits use shape + text pairing so color is
				never the sole indicator.
			</p>
			<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
				{TRAITS.map((trait) => (
					<div key={trait} style={{ display: "flex", gap: 12, alignItems: "center" }}>
						<div
							style={{
								width: 160,
								height: 40,
								borderRadius: 8,
								background: getTraitColor(trait),
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "white",
								fontWeight: 600,
								fontSize: 12,
								fontFamily: "var(--font-heading)",
							}}
						>
							{TRAIT_LABELS[trait]} (white)
						</div>
						<div
							style={{
								width: 160,
								height: 40,
								borderRadius: 8,
								background: getTraitColor(trait),
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "var(--foreground)",
								fontWeight: 600,
								fontSize: 12,
								fontFamily: "var(--font-heading)",
							}}
						>
							{TRAIT_LABELS[trait]} (dark)
						</div>
						<div
							style={{
								width: 160,
								height: 40,
								borderRadius: 8,
								background: "var(--background)",
								border: "2px solid",
								borderColor: getTraitColor(trait),
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: getTraitColor(trait),
								fontWeight: 600,
								fontSize: 12,
								fontFamily: "var(--font-heading)",
							}}
						>
							{TRAIT_LABELS[trait]} (on bg)
						</div>
					</div>
				))}
			</div>
			<div
				style={{
					fontSize: 11,
					color: "var(--muted-foreground)",
					padding: 12,
					borderRadius: 8,
					background: "var(--muted)",
					fontFamily: "var(--font-data)",
					lineHeight: 1.6,
				}}
			>
				<strong>Contrast notes:</strong>
				<br />- Openness (purple L=0.55): Use white text on fills. Passes AA as text on light bg.
				<br />- Conscientiousness (orange L=0.67): Use dark text on fills. Passes AA as text on dark bg.
				<br />- Extraversion (pink L=0.59): Use white text on fills. Passes AA as text on dark bg.
				<br />- Agreeableness (teal L=0.67): Use dark text on fills. Passes AA as text on dark bg.
				<br />- Neuroticism (navy L=0.29): Use white text on fills. Too dark for text on dark bg — use
				only as fill/border in dark mode.
				<br />
				<br />
				Dark mode uses brighter variants (L+0.12 to L+0.25) that ensure readability against dark
				backgrounds.
				<br />
				<br />
				<strong>Facet-level note:</strong> Neuroticism dark mode facets range L=0.31 (anxiety) to L=0.56
				(vulnerability). The darkest facets (anxiety, anger) should be used as fills/borders only — not
				as text color on dark backgrounds.
			</div>
		</div>
	);
}

// ─── Meta & Exports ─────────────────────────────────────────────

function TraitColorPalette() {
	return <TraitSwatches />;
}

const meta = {
	title: "Design System/Trait Color Palette",
	component: TraitColorPalette,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof TraitColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Swatches: Story = {
	name: "Trait Colors (5 traits)",
	render: () => <TraitSwatches />,
};

export const Facets: Story = {
	name: "Facet Families (30 facets)",
	render: () => <FacetFamilies />,
};

export const Gradients: Story = {
	name: "Trait Gradients (accent pairs)",
	render: () => <TraitGradients />,
};

export const WithShapes: Story = {
	name: "Colors + OCEAN Shapes",
	render: () => <ColorsWithShapes />,
};

export const Contrast: Story = {
	name: "Contrast Reference (WCAG)",
	render: () => <ContrastReference />,
};
