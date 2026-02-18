import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bubbles } from "./Bubbles";
import { GeometricOcean } from "./GeometricOcean";

/* ── Full scene ── */

const meta = {
	title: "Sea Life/GeometricOcean",
	component: GeometricOcean,
	parameters: {
		layout: "fullscreen",
	},
	argTypes: {
		depthProgress: {
			control: { type: "range", min: 0, max: 1, step: 0.05 },
			description: "Conversation depth progress (0 = surface, 1 = deep)",
		},
		pulse: {
			control: "boolean",
			description: "Simulate message arrival pulse",
		},
	},
	decorators: [
		(Story) => (
			<div
				style={{
					position: "relative",
					width: "100%",
					height: "100dvh",
					overflow: "hidden",
					background: "var(--background)",
				}}
			>
				<Story />
				<div
					style={{
						position: "relative",
						zIndex: 10,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						color: "var(--muted-foreground)",
						fontFamily: "var(--font-body)",
						fontSize: 14,
					}}
				>
					Chat content would render here
				</div>
			</div>
		),
	],
} satisfies Meta<typeof GeometricOcean>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		depthProgress: 0.3,
		pulse: false,
	},
};

export const DeepState: Story = {
	args: {
		depthProgress: 0.8,
		pulse: false,
	},
};

export const PulseActive: Story = {
	args: {
		depthProgress: 0.5,
		pulse: true,
	},
};

/* ── Individual creature stories ── */

function CreatureContainer({ children }: { children: React.ReactNode }) {
	return (
		<div
			data-slot="geometric-ocean-layer"
			style={{
				position: "relative",
				width: "100%",
				height: "100dvh",
				overflow: "hidden",
				background: "var(--background)",
			}}
		>
			{children}
		</div>
	);
}

export const BubblesOnly: StoryObj = {
	render: () => (
		<CreatureContainer>
			<Bubbles />
		</CreatureContainer>
	),
};
