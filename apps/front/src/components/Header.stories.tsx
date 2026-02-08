import type { Meta, StoryObj } from "@storybook/react-vite";

import { withRouter } from "../../.storybook/decorators";
import Header from "./Header";

const meta = {
	title: "Layout/Header",
	component: Header,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	decorators: [withRouter],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};
