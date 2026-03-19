import type { Meta, StoryObj } from "@storybook/react-vite";
import { OceanCircle } from "./OceanCircle";
import { OceanCross } from "./OceanCross";
import { OceanCutSquare } from "./OceanCutSquare";
import { OceanDiamond } from "./OceanDiamond";
import { OceanDoubleQuarter } from "./OceanDoubleQuarter";
import { OceanHalfCircle } from "./OceanHalfCircle";
import { OceanInvertedTriangle } from "./OceanInvertedTriangle";
import { OceanLollipop } from "./OceanLollipop";
import { OceanOval } from "./OceanOval";
import { OceanQuarterCircle } from "./OceanQuarterCircle";
import { OceanRectangle } from "./OceanRectangle";
import { OceanReversedHalfCircle } from "./OceanReversedHalfCircle";
import { OceanTable } from "./OceanTable";
import { OceanThreeQuarterSquare } from "./OceanThreeQuarterSquare";
import { OceanTriangle } from "./OceanTriangle";

/**
 * OCEAN Shape Library
 *
 * The UX spec defines 15 unique geometric shapes — one per OCEAN code letter.
 * Each letter has its own distinct shape — not just a size variation.
 *
 * See: ux-design-specification.md section 9.2, "Shape Library (letter -> geometric shape)"
 */

const SHAPE_SPEC = [
	{
		trait: "Openness",
		color: "var(--trait-openness)",
		levels: [
			{
				letter: "T",
				label: "Traditional",
				shape: "Equilateral cross standing upright",
				Component: OceanCross,
			},
			{
				letter: "M",
				label: "Moderate",
				shape: "Square with inverted triangle cut out",
				Component: OceanCutSquare,
			},
			{ letter: "O", label: "Open-minded", shape: "Full circle", Component: OceanCircle },
		],
	},
	{
		trait: "Conscientiousness",
		color: "var(--trait-conscientiousness)",
		levels: [
			{
				letter: "F",
				label: "Flexible",
				shape: "Three-quarter square (one side missing)",
				Component: OceanThreeQuarterSquare,
			},
			{
				letter: "S",
				label: "Steady",
				shape: "Two quarter-circles facing outward",
				Component: OceanDoubleQuarter,
			},
			{
				letter: "C",
				label: "Conscientious",
				shape: "Half-circle (flat edge)",
				Component: OceanHalfCircle,
			},
		],
	},
	{
		trait: "Extraversion",
		color: "var(--trait-extraversion)",
		levels: [
			{ letter: "I", label: "Introverted", shape: "Oval (vertical ellipse)", Component: OceanOval },
			{ letter: "B", label: "Balanced", shape: "Quarter-circle", Component: OceanQuarterCircle },
			{ letter: "E", label: "Extravert", shape: "Tall rectangle", Component: OceanRectangle },
		],
	},
	{
		trait: "Agreeableness",
		color: "var(--trait-agreeableness)",
		levels: [
			{
				letter: "D",
				label: "Direct",
				shape: "Half-circle facing opposite direction",
				Component: OceanReversedHalfCircle,
			},
			{
				letter: "P",
				label: "Pragmatic",
				shape: "Square standing on one stick",
				Component: OceanLollipop,
			},
			{ letter: "A", label: "Agreeable", shape: "Equilateral triangle", Component: OceanTriangle },
		],
	},
	{
		trait: "Neuroticism",
		color: "var(--trait-neuroticism)",
		levels: [
			{
				letter: "R",
				label: "Resilient",
				shape: "Square standing on two sticks",
				Component: OceanTable,
			},
			{
				letter: "V",
				label: "Variable",
				shape: "Inverted triangle (point down)",
				Component: OceanInvertedTriangle,
			},
			{ letter: "N", label: "Neurotic", shape: "Diamond", Component: OceanDiamond },
		],
	},
] as const;

function ImplementedShapes({ size }: { size: number }) {
	return (
		<div style={{ display: "flex", gap: 24, alignItems: "center" }}>
			{SHAPE_SPEC.map(({ trait, color, levels }) => {
				const high = levels[2];
				return (
					<div key={trait} style={{ textAlign: "center" }}>
						<high.Component size={size} color={color} />
						<div style={{ fontSize: 11, marginTop: 4, color: "var(--muted-foreground)" }}>
							{high.letter} — {trait}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function CompleteShapeLibrary({ size }: { size: number }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
			{SHAPE_SPEC.map(({ trait, color, levels }) => (
				<div key={trait}>
					<h3
						style={{
							fontSize: 14,
							fontWeight: 600,
							marginBottom: 16,
							color: "var(--foreground)",
							borderBottom: `2px solid ${color}`,
							paddingBottom: 8,
							display: "inline-block",
						}}
					>
						{trait}
					</h3>
					<div style={{ display: "flex", gap: 48, alignItems: "flex-end" }}>
						{levels.map(({ letter, label, shape, Component }) => (
							<div key={letter} style={{ textAlign: "center", minWidth: 100 }}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										height: size + 8,
									}}
								>
									<Component size={size} color={color} />
								</div>
								<div
									style={{
										fontSize: 18,
										fontWeight: 700,
										marginTop: 8,
										color: "var(--foreground)",
									}}
								>
									{letter}
								</div>
								<div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{label}</div>
								<div
									style={{
										fontSize: 10,
										color: "var(--muted-foreground)",
										opacity: 0.6,
										maxWidth: 100,
										lineHeight: 1.3,
										marginTop: 2,
									}}
								>
									{shape}
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function ShapeSpecGrid({ size }: { size: number }) {
	return (
		<table
			style={{
				borderCollapse: "collapse",
				width: "100%",
				fontSize: 12,
				color: "var(--foreground)",
			}}
		>
			<thead>
				<tr>
					<th
						style={{ padding: "8px 16px", textAlign: "left", borderBottom: "1px solid var(--border)" }}
					>
						Trait
					</th>
					<th
						style={{ padding: "8px 16px", textAlign: "center", borderBottom: "1px solid var(--border)" }}
					>
						Low
					</th>
					<th
						style={{ padding: "8px 16px", textAlign: "center", borderBottom: "1px solid var(--border)" }}
					>
						Mid
					</th>
					<th
						style={{ padding: "8px 16px", textAlign: "center", borderBottom: "1px solid var(--border)" }}
					>
						High
					</th>
				</tr>
			</thead>
			<tbody>
				{SHAPE_SPEC.map(({ trait, color, levels }) => (
					<tr key={trait}>
						<td
							style={{
								padding: "12px 16px",
								fontWeight: 600,
								borderBottom: "1px solid var(--border)",
							}}
						>
							{trait}
						</td>
						{levels.map(({ letter, label, shape, Component }) => (
							<td
								key={letter}
								style={{
									padding: "12px 16px",
									textAlign: "center",
									borderBottom: "1px solid var(--border)",
								}}
							>
								<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
									<Component size={size} color={color} />
									<span style={{ fontWeight: 700 }}>{letter}</span>
									<span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{label}</span>
									<span
										style={{
											color: "var(--muted-foreground)",
											fontSize: 10,
											opacity: 0.7,
										}}
									>
										{shape}
									</span>
								</div>
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

const meta = {
	title: "Brand/Shape Library",
	component: ImplementedShapes,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ImplementedShapes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HighLevelShapes: Story = {
	name: "5 High-Level Shapes",
	args: { size: 48 },
};

export const FullLibrary: Story = {
	name: "Complete 15-Shape Library",
	render: () => <CompleteShapeLibrary size={48} />,
	args: { size: 48 },
};

export const SpecGrid: Story = {
	name: "UX Spec Grid (Trait x Level)",
	render: () => <ShapeSpecGrid size={36} />,
	args: { size: 36 },
};

export const LargeLibrary: Story = {
	name: "Large (64px)",
	render: () => <CompleteShapeLibrary size={64} />,
	args: { size: 64 },
};
