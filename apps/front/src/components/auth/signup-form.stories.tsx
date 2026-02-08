import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { SignupForm } from "./signup-form";

const meta = {
	title: "Auth/SignupForm",
	component: SignupForm,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ValidationError: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const emailInput = canvas.getByLabelText("Email");
		const passwordInput = canvas.getByLabelText("Password");
		const confirmInput = canvas.getByLabelText("Confirm Password");
		const submitButton = canvas.getByRole("button", { name: "Sign Up" });

		// Fill in mismatched passwords to trigger validation error
		await userEvent.type(emailInput, "user@example.com");
		await userEvent.type(passwordInput, "validpassword12");
		await userEvent.type(confirmInput, "differentpassw1");
		await userEvent.click(submitButton);
	},
};
