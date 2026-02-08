import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProgressBar } from "./ProgressBar";

const meta = {
	title: "Assessment/ProgressBar",
	component: ProgressBar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: 400 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	args: {
		value: 0,
	},
};

export const Quarter: Story = {
	args: {
		value: 25,
	},
};

export const Half: Story = {
	args: {
		value: 50,
	},
};

export const NearlyThere: Story = {
	args: {
		value: 85,
	},
};

export const Complete: Story = {
	args: {
		value: 100,
	},
};

export const CustomLabel: Story = {
	args: {
		value: 60,
		label: "Profile completeness",
	},
};

export const HidePercentage: Story = {
	args: {
		value: 45,
		showPercentage: false,
	},
};
