import type { Meta, StoryObj } from "@storybook/react-vite";
import { OceanCircle } from "./OceanCircle";
import { OceanDiamond } from "./OceanDiamond";
import { OceanHalfCircle } from "./OceanHalfCircle";
import { OceanRectangle } from "./OceanRectangle";
import { OceanTriangle } from "./OceanTriangle";

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

const meta = {
	title: "Brand/Individual Shapes",
	component: AllShapesShowcase,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof AllShapesShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SmallShapes: Story = {
	name: "Small (16px)",
	args: { size: 16 },
};

export const MediumShapes: Story = {
	name: "Medium (32px)",
	args: { size: 32 },
};

export const LargeShapes: Story = {
	name: "Large (48px)",
	args: { size: 48 },
};

export const ExtraLargeShapes: Story = {
	name: "Extra Large (64px)",
	args: { size: 64 },
};
