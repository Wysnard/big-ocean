import type { Meta, StoryObj } from "@storybook/react-vite";

import { FacetBreakdown } from "./FacetBreakdown";

const meta = {
	title: "Results/FacetBreakdown",
	component: FacetBreakdown,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: 500 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof FacetBreakdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullData: Story = {
	args: {
		traitName: "openness",
		traitScore: 85,
		id: "facets-openness",
		facets: [
			{ name: "Imagination", score: 17, confidence: 88 },
			{ name: "Artistic Interests", score: 16, confidence: 75 },
			{ name: "Emotionality", score: 14, confidence: 82 },
			{ name: "Adventurousness", score: 13, confidence: 70 },
			{ name: "Intellect", score: 15, confidence: 90 },
			{ name: "Liberalism", score: 10, confidence: 65 },
		],
	},
};

export const SparseData: Story = {
	args: {
		traitName: "conscientiousness",
		traitScore: 60,
		id: "facets-conscientiousness",
		facets: [
			{ name: "Self Efficacy", score: 10, confidence: 45 },
			{ name: "Orderliness", score: 10, confidence: 10 },
			{ name: "Dutifulness", score: 10, confidence: 5 },
			{ name: "Achievement Striving", score: 10, confidence: 8 },
			{ name: "Self Discipline", score: 10, confidence: 15 },
			{ name: "Cautiousness", score: 10, confidence: 12 },
		],
	},
};

export const MixedConfidence: Story = {
	args: {
		traitName: "extraversion",
		traitScore: 72,
		id: "facets-extraversion",
		facets: [
			{ name: "Friendliness", score: 18, confidence: 92 },
			{ name: "Gregariousness", score: 12, confidence: 25 },
			{ name: "Assertiveness", score: 15, confidence: 80 },
			{ name: "Activity Level", score: 8, confidence: 15 },
			{ name: "Excitement Seeking", score: 11, confidence: 55 },
			{ name: "Cheerfulness", score: 8, confidence: 28 },
		],
	},
};

export const AllHighScores: Story = {
	args: {
		traitName: "agreeableness",
		traitScore: 105,
		id: "facets-agreeableness",
		facets: [
			{ name: "Trust", score: 18, confidence: 85 },
			{ name: "Morality", score: 17, confidence: 90 },
			{ name: "Altruism", score: 19, confidence: 88 },
			{ name: "Cooperation", score: 16, confidence: 82 },
			{ name: "Modesty", score: 15, confidence: 75 },
			{ name: "Sympathy", score: 20, confidence: 95 },
		],
	},
};
