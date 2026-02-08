import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronRight, Loader2, Mail } from "lucide-react";
import { fn } from "storybook/test";

import { Button } from "./button";

const meta = {
	title: "UI/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Variants ---

export const Default: Story = {
	args: {
		children: "Default",
	},
};

export const Destructive: Story = {
	args: {
		variant: "destructive",
		children: "Destructive",
	},
};

export const Outline: Story = {
	args: {
		variant: "outline",
		children: "Outline",
	},
};

export const Secondary: Story = {
	args: {
		variant: "secondary",
		children: "Secondary",
	},
};

export const Ghost: Story = {
	args: {
		variant: "ghost",
		children: "Ghost",
	},
};

export const Link: Story = {
	args: {
		variant: "link",
		children: "Link",
	},
};

// --- Sizes ---

export const DefaultSize: Story = {
	args: {
		children: "Default Size",
	},
};

export const Small: Story = {
	args: {
		size: "sm",
		children: "Small",
	},
};

export const Large: Story = {
	args: {
		size: "lg",
		children: "Large",
	},
};

export const Icon: Story = {
	args: {
		size: "icon",
		variant: "outline",
		children: <ChevronRight />,
	},
};

// --- With Icons ---

export const WithIcon: Story = {
	args: {
		children: (
			<>
				<Mail /> Login with Email
			</>
		),
	},
};

export const Loading: Story = {
	args: {
		disabled: true,
		children: (
			<>
				<Loader2 className="animate-spin" /> Please wait
			</>
		),
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		children: "Disabled",
	},
};
