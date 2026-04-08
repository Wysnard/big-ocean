/**
 * Signup Page
 *
 * User registration with Better Auth.
 * Redirects authenticated users to /assessment or /profile (AC #5).
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignupForm } from "../components/auth";
import { PageMain } from "../components/PageMain";
import { getServerSession } from "../lib/auth.server";

export const Route = createFileRoute("/signup")({
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
	component: SignupPage,
});

function SignupPage() {
	const { sessionId, redirectTo } = Route.useSearch();

	return (
		<PageMain
			title="Create your account"
			className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background"
		>
			<div className="w-full max-w-md">
				<SignupForm anonymousSessionId={sessionId} redirectTo={redirectTo} />
			</div>
		</PageMain>
	);
}
