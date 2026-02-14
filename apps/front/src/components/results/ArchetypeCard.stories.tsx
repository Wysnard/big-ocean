import type { Meta, StoryObj } from "@storybook/react-vite";
import { OceanCode4Schema, OceanCode5Schema } from "@workspace/domain";

import { ArchetypeCard } from "./ArchetypeCard";

const meta = {
	title: "Results/ArchetypeCard",
	component: ArchetypeCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: 600, maxWidth: "100%" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ArchetypeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CuratedArchetype: Story = {
	args: {
		archetypeName: "The Catalyst",
		oceanCode4: OceanCode4Schema.make("ODEW"),
		oceanCode5: OceanCode5Schema.make("ODEWR"),
		description:
			"A dynamic force who combines boundless curiosity with disciplined execution. You thrive in social settings and build deep connections through genuine empathy.",
		color: "#6B5CE7",
		isCurated: true,
		overallConfidence: 82,
	},
};

export const GeneratedArchetype: Story = {
	args: {
		archetypeName: "Creative Collaborator",
		oceanCode4: OceanCode4Schema.make("OFAW"),
		oceanCode5: OceanCode5Schema.make("OFAWR"),
		description:
			"An imaginative free spirit who values harmony and connection. Your creativity flows naturally, though structure may feel constraining at times.",
		color: "#7A8B9C",
		isCurated: false,
		overallConfidence: 65,
	},
};

export const LowConfidence: Story = {
	args: {
		archetypeName: "The Explorer",
		oceanCode4: OceanCode4Schema.make("OBAN"),
		oceanCode5: OceanCode5Schema.make("OBANT"),
		description:
			"Driven by curiosity and a desire to understand the world. You balance exploration with a steady, grounded approach to relationships.",
		color: "#E87B35",
		isCurated: true,
		overallConfidence: 28,
	},
};

export const HighConfidence: Story = {
	args: {
		archetypeName: "The Architect",
		oceanCode4: OceanCode4Schema.make("GDEN"),
		oceanCode5: OceanCode5Schema.make("GDENT"),
		description:
			"A methodical builder who brings order to complexity. Your strong conscientiousness and extraversion make you a natural leader in structured environments.",
		color: "#4CAF6E",
		isCurated: true,
		overallConfidence: 95,
	},
};
