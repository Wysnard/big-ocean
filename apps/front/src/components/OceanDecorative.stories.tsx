import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { withThemeProvider } from "../../.storybook/decorators";
import {
	BubblesDecoration,
	CoralDecoration,
	SeaweedDecoration,
	WaveDecoration,
} from "./OceanDecorative";

function DecorationFrame({ children }: { children: ReactNode }) {
	return (
		<div className="w-[280px] rounded-xl border border-border bg-card p-6 text-foreground">
			{children}
		</div>
	);
}

const meta = {
	title: "Illustration/OceanDecorative",
	component: WaveDecoration,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [withThemeProvider],
} satisfies Meta<typeof WaveDecoration>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wave: Story = {
	render: () => (
		<DecorationFrame>
			<WaveDecoration className="text-foreground" />
		</DecorationFrame>
	),
};

export const Bubbles: Story = {
	render: () => (
		<DecorationFrame>
			<BubblesDecoration className="h-36 w-36 text-foreground" />
		</DecorationFrame>
	),
};

export const Coral: Story = {
	render: () => (
		<DecorationFrame>
			<CoralDecoration className="h-36 w-28 text-foreground" />
		</DecorationFrame>
	),
};

export const Seaweed: Story = {
	render: () => (
		<DecorationFrame>
			<SeaweedDecoration className="h-36 w-36 text-foreground" />
		</DecorationFrame>
	),
};

export const AllDecorationsGrid: Story = {
	render: () => (
		<div className="grid grid-cols-2 gap-6">
			<DecorationFrame>
				<WaveDecoration className="text-foreground" />
			</DecorationFrame>
			<DecorationFrame>
				<BubblesDecoration className="h-32 w-32 text-foreground" />
			</DecorationFrame>
			<DecorationFrame>
				<CoralDecoration className="h-32 w-24 text-foreground" />
			</DecorationFrame>
			<DecorationFrame>
				<SeaweedDecoration className="h-32 w-32 text-foreground" />
			</DecorationFrame>
		</div>
	),
};
