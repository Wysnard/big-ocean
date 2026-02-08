import { fn } from "storybook/test";

export const useAuth = fn(() => ({
	session: null,
	user: null,
	isAuthenticated: false,
	isPending: false,
	error: null,
	signIn: {
		email: fn(async (_email: string, _password: string) => {
			await new Promise((resolve) => setTimeout(resolve, 500));
			return { user: { id: "1", email: _email } };
		}).mockName("signIn.email"),
	},
	signUp: {
		email: fn(async (_email: string, _password: string, _name?: string, _sessionId?: string) => {
			await new Promise((resolve) => setTimeout(resolve, 500));
			return { user: { id: "1", email: _email } };
		}).mockName("signUp.email"),
	},
	signOut: fn(async () => {}).mockName("signOut"),
})).mockName("useAuth");

export const useRequireAuth = fn(() => ({
	user: null,
	isAuthenticated: false,
	isPending: false,
})).mockName("useRequireAuth");
