import type { Meta, StoryObj } from "@storybook/react-vite";

import { withThemeProvider } from "../../../.storybook/decorators";
import {
	AnchorIcon,
	BubbleIcon,
	CompassIcon,
	LighthouseIcon,
	PearlIcon,
	RisingBubblesIcon,
	ShellIcon,
	WaveIcon,
} from "./ocean-icons";

const ICONS = [
	{ name: "Shell", Icon: ShellIcon },
	{ name: "Compass", Icon: CompassIcon },
	{ name: "Anchor", Icon: AnchorIcon },
	{ name: "Bubble", Icon: BubbleIcon },
	{ name: "Wave", Icon: WaveIcon },
	{ name: "Pearl", Icon: PearlIcon },
	{ name: "Rising Bubbles", Icon: RisingBubblesIcon },
	{ name: "Lighthouse", Icon: LighthouseIcon },
] as const;

const meta = {
	title: "Illustration/OceanIcons",
	component: ShellIcon,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [withThemeProvider],
	args: {
		size: 24,
	},
} satisfies Meta<typeof ShellIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIconsGrid: Story = {
	render: () => (
		<div className="grid grid-cols-4 gap-6">
			{ICONS.map(({ name, Icon }) => (
				<div
					key={name}
					className="flex w-24 flex-col items-center gap-2 rounded-md border border-border p-3"
				>
					<Icon size={24} />
					<span className="text-xs text-muted-foreground">{name}</span>
				</div>
			))}
		</div>
	),
};

export const SizeVariants: Story = {
	render: () => (
		<div className="space-y-5">
			{[16, 24, 32, 48].map((size) => (
				<div key={size} className="flex items-center gap-4">
					<span className="w-16 text-xs text-muted-foreground">{size}px</span>
					<div className="flex gap-3">
						{ICONS.map(({ name, Icon }) => (
							<Icon key={`${name}-${size}`} size={size} />
						))}
					</div>
				</div>
			))}
		</div>
	),
};
