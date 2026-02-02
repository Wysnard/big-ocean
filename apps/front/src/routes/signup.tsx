/**
 * Signup Page
 *
 * User registration with Better Auth.
 */

import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "../components/auth";

export const Route = createFileRoute("/signup")({
	component: SignupPage,
});

function SignupPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="w-full max-w-md">
				<SignupForm />
			</div>
		</div>
	);
}
