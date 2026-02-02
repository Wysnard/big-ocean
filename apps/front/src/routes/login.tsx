/**
 * Login Page
 *
 * User authentication with Better Auth.
 */

import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "../components/auth";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="w-full max-w-md">
				<LoginForm />
			</div>
		</div>
	);
}
