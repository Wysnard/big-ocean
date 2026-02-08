import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within } from "storybook/test";

import { SignUpModal } from "./SignUpModal";

const meta = {
	title: "Auth/SignUpModal",
	component: SignUpModal,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof SignUpModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		isOpen: true,
		sessionId: "test-session-123",
		onClose: fn(),
	},
};

export const WithError: Story = {
	args: {
		isOpen: true,
		sessionId: "test-session-123",
		onClose: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const emailInput = canvas.getByLabelText("Email");
		const passwordInput = canvas.getByLabelText("Password");
		const submitButton = canvas.getByRole("button", { name: "Sign Up" });

		// Fill in invalid email to trigger validation error
		await userEvent.type(emailInput, "not-an-email");
		await userEvent.type(passwordInput, "validpassword12");
		await userEvent.click(submitButton);
	},
};

export const PasswordValidation: Story = {
	args: {
		isOpen: true,
		sessionId: "test-session-123",
		onClose: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const emailInput = canvas.getByLabelText("Email");
		const passwordInput = canvas.getByLabelText("Password");
		const submitButton = canvas.getByRole("button", { name: "Sign Up" });

		// Fill in valid email but short password to trigger password validation
		await userEvent.type(emailInput, "user@example.com");
		await userEvent.type(passwordInput, "short");
		await userEvent.click(submitButton);
	},
};
