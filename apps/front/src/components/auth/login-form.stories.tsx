import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { LoginForm } from "./login-form";

const meta = {
	title: "Auth/LoginForm",
	component: LoginForm,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ValidationError: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const emailInput = canvas.getByLabelText("Email");
		const passwordInput = canvas.getByLabelText("Password");
		const submitButton = canvas.getByRole("button", { name: "Sign In" });

		// Fill in credentials and submit to trigger mock auth error
		await userEvent.type(emailInput, "user@example.com");
		await userEvent.type(passwordInput, "wrongpassword1");
		await userEvent.click(submitButton);
	},
};
