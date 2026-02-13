import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "@storybook/test";

import { TraitBar } from "./TraitBar";

const meta = {
	title: "Results/TraitBar",
	component: TraitBar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: {
		onToggle: fn(),
	},
	decorators: [
		(Story) => (
			<div style={{ width: 500 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof TraitBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HighOpenness: Story = {
	args: {
		traitName: "openness",
		score: 95,
		level: "O",
		confidence: 85,
		color: "#6B5CE7",
		isExpanded: false,
		controlsId: "facets-openness",
	},
};

export const MidConscientiousness: Story = {
	args: {
		traitName: "conscientiousness",
		score: 60,
		level: "B",
		confidence: 62,
		color: "#E87B35",
		isExpanded: false,
		controlsId: "facets-conscientiousness",
	},
};

export const LowExtraversion: Story = {
	args: {
		traitName: "extraversion",
		score: 25,
		level: "I",
		confidence: 70,
		color: "#E74C8B",
		isExpanded: false,
		controlsId: "facets-extraversion",
	},
};

export const Expanded: Story = {
	args: {
		traitName: "agreeableness",
		score: 90,
		level: "W",
		confidence: 78,
		color: "#4CAF6E",
		isExpanded: true,
		controlsId: "facets-agreeableness",
	},
};

export const LowConfidence: Story = {
	args: {
		traitName: "neuroticism",
		score: 45,
		level: "T",
		confidence: 22,
		color: "#2C3E7B",
		isExpanded: false,
		controlsId: "facets-neuroticism",
	},
};

export const HighConfidence: Story = {
	args: {
		traitName: "openness",
		score: 100,
		level: "O",
		confidence: 95,
		color: "#6B5CE7",
		isExpanded: false,
		controlsId: "facets-openness",
	},
};
