/**
 * Login Form Component
 *
 * Email/password login with Better Auth.
 */

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { buildAuthPageHref } from "../../lib/auth-session-linking";

interface LoginFormProps {
	anonymousSessionId?: string;
	redirectTo?: string;
}

export function LoginForm({ anonymousSessionId, redirectTo }: LoginFormProps) {
	const { signIn, isPending } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			await signIn.email(email, password, anonymousSessionId);

			// Navigate using TanStack Router
			if (redirectTo) {
				await navigate({ to: redirectTo });
			} else if (anonymousSessionId) {
				await navigate({ to: "/results/$sessionId", params: { sessionId: anonymousSessionId } });
			} else {
				await navigate({ to: "/dashboard" });
			}
		} catch (err) {
			setError((err instanceof Error ? err.message : String(err)) || "Invalid email or password");
		} finally {
			setIsLoading(false);
		}
	};

	if (isPending) {
		return <div>Checking authentication...</div>;
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6">
			<h2 className="text-2xl font-bold mb-6">Sign In</h2>

			{error && (
				<div className="bg-red-50 text-red-700 p-3 rounded border border-red-200">{error}</div>
			)}

			<div>
				<label htmlFor="email" className="block text-sm font-medium mb-1">
					Email
				</label>
				<input
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="you@example.com"
				/>
			</div>

			<div>
				<label htmlFor="password" className="block text-sm font-medium mb-1">
					Password
				</label>
				<input
					id="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					minLength={12}
					className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="••••••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={isLoading}
				className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
			>
				{isLoading ? "Signing in..." : "Sign In"}
			</button>

			<p className="text-sm text-center text-gray-600">
				Don't have an account?{" "}
				<a
					href={buildAuthPageHref("/signup", {
						sessionId: anonymousSessionId,
						redirectTo,
					})}
					className="text-blue-600 hover:underline"
				>
					Sign up
				</a>
			</p>
		</form>
	);
}
