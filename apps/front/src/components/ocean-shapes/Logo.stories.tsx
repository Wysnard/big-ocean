import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "../../../.storybook/decorators";
import { Logo } from "../Logo";
import { OceanShapeSet } from "./OceanShapeSet";

const meta = {
	title: "Brand/Logo",
	component: Logo,
	decorators: [withRouter],
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeaderSize: Story = {
	name: "Header Size",
};

export const HeroSize: Story = {
	name: "Large Hero Usage",
	render: () => (
		<div className="flex items-center gap-2">
			<span className="text-4xl font-heading font-bold text-foreground">big-</span>
			<OceanShapeSet size={40} />
		</div>
	),
};
