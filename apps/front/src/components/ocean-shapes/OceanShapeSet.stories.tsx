import type { Meta, StoryObj } from "@storybook/react-vite";
import { OceanShapeSet } from "./OceanShapeSet";

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

const meta = {
	title: "Brand/OceanShapeSet",
	component: ShapeSetShowcase,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ShapeSetShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ColorAndMonochrome: Story = {
	name: "Color + Monochrome Variants",
};
