import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArchetypeCardTemplate, type ArchetypeCardTemplateProps } from "./archetype-card-template";

const meta: Meta<ArchetypeCardTemplateProps> = {
	title: "Sharing/ArchetypeCardTemplate",
	component: ArchetypeCardTemplate,
	parameters: {
		layout: "centered",
		backgrounds: { default: "dark" },
	},
};

export default meta;
type Story = StoryObj<ArchetypeCardTemplateProps>;

const defaultTraitScores = {
	openness: 95,
	conscientiousness: 72,
	extraversion: 88,
	agreeableness: 60,
	neuroticism: 45,
};

export const Story916: Story = {
	name: "9:16 Story Format",
	args: {
		archetypeName: "The Luminous Voyager",
		oceanCode: "HHMHM",
		displayName: "Alex",
		traitScores: defaultTraitScores,
		dominantColor: "#A855F7",
		width: 1080,
		height: 1920,
	},
	decorators: [
		(Story) => (
			<div style={{ transform: "scale(0.3)", transformOrigin: "top center" }}>
				<Story />
			</div>
		),
	],
};

export const Post1x1: Story = {
	name: "1:1 Post Format",
	args: {
		archetypeName: "The Luminous Voyager",
		oceanCode: "HHMHM",
		displayName: "Alex",
		traitScores: defaultTraitScores,
		dominantColor: "#A855F7",
		width: 1080,
		height: 1080,
	},
	decorators: [
		(Story) => (
			<div style={{ transform: "scale(0.4)", transformOrigin: "top center" }}>
				<Story />
			</div>
		),
	],
};

export const NoDisplayName: Story = {
	name: "No Display Name",
	args: {
		archetypeName: "The Quiet Strategist",
		oceanCode: "MHLMH",
		displayName: null,
		traitScores: {
			openness: 55,
			conscientiousness: 100,
			extraversion: 35,
			agreeableness: 55,
			neuroticism: 90,
		},
		dominantColor: "#FF6B2B",
		width: 1080,
		height: 1080,
	},
	decorators: [
		(Story) => (
			<div style={{ transform: "scale(0.4)", transformOrigin: "top center" }}>
				<Story />
			</div>
		),
	],
};

export const HighNeuroticism: Story = {
	name: "Dominant Neuroticism",
	args: {
		archetypeName: "The Deep Feeler",
		oceanCode: "MLMHH",
		displayName: "Jordan",
		traitScores: {
			openness: 55,
			conscientiousness: 40,
			extraversion: 50,
			agreeableness: 85,
			neuroticism: 105,
		},
		dominantColor: "#1c1c9c",
		width: 1080,
		height: 1920,
	},
	decorators: [
		(Story) => (
			<div style={{ transform: "scale(0.3)", transformOrigin: "top center" }}>
				<Story />
			</div>
		),
	],
};
