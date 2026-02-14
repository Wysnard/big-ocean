/**
 * Login Form Component
 *
 * Email/password login with Better Auth.
 * Styled with psychedelic brand identity tokens.
 */

import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { buildAuthPageHref } from "../../lib/auth-session-linking";
import { OceanShapeSet } from "../ocean-shapes";

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
	const errorId = "login-form-error";

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
		return (
			<div className="flex items-center justify-center p-6 text-muted-foreground">
				Checking authentication...
			</div>
		);
	}

	return (
		<div className="relative mx-auto max-w-md overflow-hidden rounded-3xl bg-card p-8 shadow-lg sm:p-10">
			{/* Corner geometric decorations */}
			<div className="pointer-events-none absolute -right-2.5 -top-2.5" aria-hidden="true">
				<div className="absolute right-4 top-4 h-11 w-11 rounded-full bg-trait-openness opacity-10" />
				<div
					className="absolute right-13 top-1 h-0 w-0 opacity-8"
					style={{
						borderLeft: "12px solid transparent",
						borderRight: "12px solid transparent",
						borderBottom: "20px solid var(--trait-agreeableness)",
					}}
				/>
			</div>

			{/* Brand mark */}
			<div className="mb-5 flex items-center gap-1">
				<span className="font-heading text-lg font-bold tracking-tight text-foreground">big-</span>
				<OceanShapeSet size={12} />
			</div>

			{/* Heading with gradient accent */}
			<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
				Welcome{" "}
				<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
					back
				</span>
			</h2>
			<p className="mt-2 mb-6 text-sm text-muted-foreground">Sign in to continue your journey.</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				{error && (
					<p
						id={errorId}
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</p>
				)}

				<div>
					<label htmlFor="login-email" className="mb-1 block text-sm font-medium text-foreground">
						Email
					</label>
					<input
						id="login-email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						autoComplete="email"
						className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						placeholder="you@example.com"
						aria-invalid={!!error}
						aria-describedby={error ? errorId : undefined}
					/>
				</div>

				<div>
					<label htmlFor="login-password" className="mb-1 block text-sm font-medium text-foreground">
						Password
					</label>
					<input
						id="login-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={12}
						autoComplete="current-password"
						className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						placeholder="Your password"
						aria-invalid={!!error}
						aria-describedby={error ? errorId : undefined}
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="mt-3 min-h-[52px] w-full rounded-xl bg-foreground font-heading text-base font-bold tracking-tight text-background transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
				>
					{isLoading && <Loader2 className="mr-2 inline h-4 w-4 motion-safe:animate-spin" />}
					{isLoading ? "Signing in..." : "Sign In"}
				</button>

				<button
					type="button"
					onClick={() => {
						window.location.href = buildAuthPageHref("/signup", {
							sessionId: anonymousSessionId,
							redirectTo,
						});
					}}
					className="min-h-11 w-full rounded-xl bg-transparent text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
				>
					New here? Create account
				</button>
			</form>
		</div>
	);
}
