import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "../../../.storybook/decorators";
import { Logo } from "../Logo";
import { GeometricSignature } from "./GeometricSignature";
import { OceanCircle } from "./OceanCircle";
import { OceanDiamond } from "./OceanDiamond";
import { OceanHalfCircle } from "./OceanHalfCircle";
import { OceanRectangle } from "./OceanRectangle";
import { OceanShapeSet } from "./OceanShapeSet";
import { OceanTriangle } from "./OceanTriangle";

// ─── Individual Shapes ───────────────────────────────────────────

function AllShapesShowcase({ size }: { size: number }) {
	return (
		<div style={{ display: "flex", gap: 24, alignItems: "center" }}>
			<div style={{ textAlign: "center" }}>
				<OceanCircle size={size} color="var(--trait-openness)" />
				<div style={{ fontSize: 11, marginTop: 4, color: "var(--muted-foreground)" }}>O - Circle</div>
			</div>
			<div style={{ textAlign: "center" }}>
				<OceanHalfCircle size={size} color="var(--trait-conscientiousness)" />
				<div style={{ fontSize: 11, marginTop: 4, color: "var(--muted-foreground)" }}>
					C - Half-Circle
				</div>
			</div>
			<div style={{ textAlign: "center" }}>
				<OceanRectangle size={size} color="var(--trait-extraversion)" />
				<div style={{ fontSize: 11, marginTop: 4, color: "var(--muted-foreground)" }}>
					E - Rectangle
				</div>
			</div>
			<div style={{ textAlign: "center" }}>
				<OceanTriangle size={size} color="var(--trait-agreeableness)" />
				<div style={{ fontSize: 11, marginTop: 4, color: "var(--muted-foreground)" }}>A - Triangle</div>
			</div>
			<div style={{ textAlign: "center" }}>
				<OceanDiamond size={size} color="var(--trait-neuroticism)" />
				<div style={{ fontSize: 11, marginTop: 4, color: "var(--muted-foreground)" }}>N - Diamond</div>
			</div>
		</div>
	);
}

const shapeMeta = {
	title: "Brand/Individual Shapes",
	component: AllShapesShowcase,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof AllShapesShowcase>;

export default shapeMeta;
type ShapeStory = StoryObj<typeof shapeMeta>;

export const SmallShapes: ShapeStory = {
	name: "Small (16px)",
	args: { size: 16 },
};

export const MediumShapes: ShapeStory = {
	name: "Medium (32px)",
	args: { size: 32 },
};

export const LargeShapes: ShapeStory = {
	name: "Large (48px)",
	args: { size: 48 },
};

export const ExtraLargeShapes: ShapeStory = {
	name: "Extra Large (64px)",
	args: { size: 64 },
};

// ─── OceanShapeSet ───────────────────────────────────────────────

function ShapeSetShowcase() {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
			<div>
				<h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--foreground)" }}>
					Full Color (Default)
				</h3>
				<div style={{ display: "flex", gap: 24, alignItems: "center" }}>
					<OceanShapeSet size={16} />
					<OceanShapeSet size={24} />
					<OceanShapeSet size={32} />
					<OceanShapeSet size={48} />
				</div>
			</div>
			<div>
				<h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--foreground)" }}>
					Monochrome
				</h3>
				<div style={{ display: "flex", gap: 24, alignItems: "center" }}>
					<OceanShapeSet size={16} variant="monochrome" />
					<OceanShapeSet size={24} variant="monochrome" />
					<OceanShapeSet size={32} variant="monochrome" />
					<OceanShapeSet size={48} variant="monochrome" />
				</div>
			</div>
		</div>
	);
}

export const ShapeSet: ShapeStory = {
	name: "OceanShapeSet (Color + Monochrome)",
	render: () => <ShapeSetShowcase />,
};

// ─── GeometricSignature ──────────────────────────────────────────

function SignatureShowcase() {
	const codes = [
		{ code: "ODEWR", label: "All High" },
		{ code: "PFICR", label: "All Low" },
		{ code: "GBANT", label: "All Mid" },
		{ code: "ODAWS", label: "Mixed (Open Diplomat)" },
		{ code: "PFIWR", label: "Mixed (Quiet Helper)" },
	];

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
			{codes.map(({ code, label }) => (
				<div key={code}>
					<div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>
						{label} — {code}
					</div>
					<GeometricSignature oceanCode={code} baseSize={48} />
				</div>
			))}
		</div>
	);
}

export const Signatures: ShapeStory = {
	name: "GeometricSignature (Various Codes)",
	render: () => <SignatureShowcase />,
};

export const SignatureWithArchetype: ShapeStory = {
	name: "GeometricSignature with Archetype Name",
	render: () => (
		<GeometricSignature oceanCode="ODEWR" baseSize={64} archetypeName="Creative Diplomat" />
	),
};

// ─── Reveal Animation ────────────────────────────────────────────

export const RevealAnimation: ShapeStory = {
	name: "Reveal Animation",
	render: () => (
		<div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center" }}>
			<div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
				Reload this story to replay the animation
			</div>
			<GeometricSignature oceanCode="ODEWR" baseSize={64} animate archetypeName="Creative Diplomat" />
		</div>
	),
};

// ─── Logo with Brand Mark ────────────────────────────────────────

export const LogoBrandMark: ShapeStory = {
	name: "Logo with Brand Mark",
	decorators: [withRouter],
	render: () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 24,
				padding: 32,
				backgroundColor: "var(--background)",
			}}
		>
			<div>
				<div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8 }}>
					Header size
				</div>
				<Logo />
			</div>
			<div>
				<div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8 }}>
					Large hero usage
				</div>
				<div className="flex items-center gap-2">
					<span className="text-4xl font-heading font-bold text-foreground">big-</span>
					<OceanShapeSet size={40} />
				</div>
			</div>
		</div>
	),
};
