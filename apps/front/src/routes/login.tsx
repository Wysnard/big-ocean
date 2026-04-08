/**
 * Login Page
 *
 * User authentication with Better Auth.
 * Redirects authenticated users to /assessment or /profile (AC #5).
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "../components/auth";
import { PageMain } from "../components/PageMain";
import { getServerSession } from "../lib/auth.server";

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>) => ({
		sessionId: typeof search.sessionId === "string" ? search.sessionId : undefined,
		redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
	}),
	beforeLoad: async () => {
		const session = await getServerSession();
		if (session?.user) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const { sessionId, redirectTo } = Route.useSearch();

	return (
		<PageMain
			title="Sign in"
			className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background"
		>
			<div className="w-full max-w-md">
				<LoginForm anonymousSessionId={sessionId} redirectTo={redirectTo} />
			</div>
		</PageMain>
	);
}
