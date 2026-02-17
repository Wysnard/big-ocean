import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronRight, Download, Loader2, Mail, MessageCircle, User } from "lucide-react";
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

// --- Action Variant ---

export const Action: Story = {
	args: {
		variant: "action",
		size: "action",
		children: (
			<>
				<div className="flex-shrink-0 rounded-lg p-2 bg-primary/10 text-primary">
					<MessageCircle className="size-4" />
				</div>
				<div className="flex-1 min-w-0 text-left">
					<p className="text-sm font-medium text-foreground">Resume Conversation</p>
					<p className="text-xs text-muted-foreground font-normal">
						Continue exploring your personality
					</p>
				</div>
				<ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
			</>
		),
	},
	decorators: [
		(Story) => (
			<div className="w-[320px]">
				<Story />
			</div>
		),
	],
};

export const ActionGroup: Story = {
	args: { variant: "action", size: "action" },
	decorators: [
		() => (
			<div className="w-[320px] space-y-2">
				<Button variant="action" size="action" onClick={fn()}>
					<div className="flex-shrink-0 rounded-lg p-2 bg-primary/10 text-primary">
						<MessageCircle className="size-4" />
					</div>
					<div className="flex-1 min-w-0 text-left">
						<p className="text-sm font-medium text-foreground">Resume Conversation</p>
						<p className="text-xs text-muted-foreground font-normal">
							Continue exploring your personality
						</p>
					</div>
					<ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
				</Button>
				<Button variant="action" size="action" onClick={fn()}>
					<div className="flex-shrink-0 rounded-lg p-2 bg-[oklch(0.67_0.13_181/0.10)] text-[oklch(0.45_0.13_181)]">
						<User className="size-4" />
					</div>
					<div className="flex-1 min-w-0 text-left">
						<p className="text-sm font-medium text-foreground">View Public Profile</p>
						<p className="text-xs text-muted-foreground font-normal">
							See how others view your archetype
						</p>
					</div>
					<ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
				</Button>
				<Button variant="action" size="action" disabled onClick={fn()}>
					<div className="flex-shrink-0 rounded-lg p-2 bg-muted text-muted-foreground">
						<Download className="size-4" />
					</div>
					<div className="flex-1 min-w-0 text-left">
						<p className="text-sm font-medium text-foreground">Download Report</p>
						<p className="text-xs text-muted-foreground font-normal">Get a PDF summary of your results</p>
					</div>
					<ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
				</Button>
			</div>
		),
	],
};
