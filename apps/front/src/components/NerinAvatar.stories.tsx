import type { Meta, StoryObj } from "@storybook/react-vite";

import { withThemeProvider } from "../../.storybook/decorators";
import { NerinAvatar } from "./NerinAvatar";

const meta = {
	title: "Illustration/NerinAvatar",
	component: NerinAvatar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [withThemeProvider],
	args: {
		size: 40,
		confidence: 100,
	},
} satisfies Meta<typeof NerinAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
	args: {
		size: 32,
	},
};

export const Medium: Story = {
	args: {
		size: 64,
	},
};

export const Large: Story = {
	args: {
		size: 128,
	},
};

export const Hero: Story = {
	args: {
		size: 256,
	},
};

export const LowConfidence: Story = {
	args: {
		confidence: 20,
	},
};

export const MediumConfidence: Story = {
	args: {
		confidence: 50,
	},
};

export const HighConfidence: Story = {
	args: {
		confidence: 90,
	},
};

export const ConfidenceTiersComparison: Story = {
	render: () => (
		<div className="flex items-end gap-8">
			<div className="flex flex-col items-center gap-3">
				<NerinAvatar size={72} confidence={20} />
				<span className="text-sm text-muted-foreground">Low (20%)</span>
			</div>
			<div className="flex flex-col items-center gap-3">
				<NerinAvatar size={72} confidence={50} />
				<span className="text-sm text-muted-foreground">Medium (50%)</span>
			</div>
			<div className="flex flex-col items-center gap-3">
				<NerinAvatar size={72} confidence={90} />
				<span className="text-sm text-muted-foreground">High (90%)</span>
			</div>
		</div>
	),
};
