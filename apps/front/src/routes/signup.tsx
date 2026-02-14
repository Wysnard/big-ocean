/**
 * Signup Page
 *
 * User registration with Better Auth.
 */

import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "../components/auth";

export const Route = createFileRoute("/signup")({
	validateSearch: (search: Record<string, unknown>) => ({
		sessionId: typeof search.sessionId === "string" ? search.sessionId : undefined,
		redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
	}),
	component: SignupPage,
});

function SignupPage() {
	const { sessionId, redirectTo } = Route.useSearch();

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="w-full max-w-md">
				<SignupForm anonymousSessionId={sessionId} redirectTo={redirectTo} />
			</div>
		</div>
	);
}
