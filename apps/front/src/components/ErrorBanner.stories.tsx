import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ErrorBanner } from "./ErrorBanner";

const meta = {
	title: "Assessment/ErrorBanner",
	component: ErrorBanner,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: {
		onDismiss: fn(),
	},
	decorators: [
		(Story) => (
			<div style={{ width: 500 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ErrorBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		message: "Something went wrong. Please try again.",
	},
};

export const WithRetry: Story = {
	args: {
		message: "Failed to send message. Check your connection.",
		onRetry: fn(),
	},
};

export const NetworkError: Story = {
	args: {
		message: "Network error: Unable to reach the server.",
		onRetry: fn(),
	},
};

export const LongMessage: Story = {
	args: {
		message:
			"An unexpected error occurred while processing your request. The assessment session could not be resumed because the server returned an invalid response. Please refresh the page and try again.",
	},
};

export const NoAutoDismiss: Story = {
	args: {
		message: "This error will not auto-dismiss.",
		autoDismissMs: 0,
	},
};
