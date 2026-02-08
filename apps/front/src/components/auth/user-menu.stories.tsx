import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Mock } from "storybook/test";
import { useAuth } from "../../hooks/use-auth";

import { UserMenu } from "./user-menu";

const meta = {
	title: "Auth/UserMenu",
	component: UserMenu,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unauthenticated: Story = {};

export const Authenticated: Story = {
	beforeEach: () => {
		(useAuth as Mock).mockReturnValue({
			session: {
				user: { id: "1", name: "Jane Doe", email: "jane@example.com" },
			},
			user: { id: "1", name: "Jane Doe", email: "jane@example.com" },
			isAuthenticated: true,
			isPending: false,
			error: null,
			signIn: { email: async () => ({}) },
			signUp: { email: async () => ({}) },
			signOut: async () => {},
		});
	},
};
