/**
 * Signup Form Component
 *
 * Email/password registration with Better Auth.
 * Styled with psychedelic brand identity tokens.
 */

import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { buildAuthPageHref } from "../../lib/auth-session-linking";
import { OceanShapeSet } from "../ocean-shapes";

interface SignupFormProps {
	anonymousSessionId?: string;
	redirectTo?: string;
}

export function SignupForm({ anonymousSessionId, redirectTo }: SignupFormProps) {
	const { signUp } = useAuth();
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const errorId = "signup-form-error";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validate password match
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		// Validate password length (NIST 2025 standard: 12 chars minimum)
		if (password.length < 12) {
			setError("Password must be at least 12 characters");
			return;
		}

		setIsLoading(true);

		try {
			await signUp.email(email, password, name, anonymousSessionId);

			// Navigate using TanStack Router
			if (redirectTo) {
				await navigate({ to: redirectTo });
			} else if (anonymousSessionId) {
				await navigate({
					to: "/results/$assessmentSessionId",
					params: { assessmentSessionId: anonymousSessionId },
				});
			} else {
				await navigate({ to: "/profile" });
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			if (errorMessage.includes("already exists")) {
				setError("An account with this email already exists");
			} else {
				setError(errorMessage || "Sign up failed. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	};

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
				Start your{" "}
				<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
					discovery
				</span>
			</h2>
			<p className="mt-2 mb-6 text-sm text-muted-foreground">
				Create an account to unlock your personality profile.
			</p>

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
					<label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-foreground">
						Name
					</label>
					<input
						id="signup-name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						autoComplete="name"
						className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						placeholder="Your name"
						aria-invalid={!!error}
						aria-describedby={error ? errorId : undefined}
					/>
				</div>

				<div>
					<label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-foreground">
						Email
					</label>
					<input
						id="signup-email"
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
					<label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-foreground">
						Password
					</label>
					<input
						id="signup-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={12}
						autoComplete="new-password"
						className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						placeholder="At least 12 characters"
						aria-invalid={!!error}
						aria-describedby={error ? errorId : "signup-password-help"}
					/>
					<p id="signup-password-help" className="mt-1 text-xs text-muted-foreground">
						Minimum 12 characters
					</p>
				</div>

				<div>
					<label
						htmlFor="signup-confirm-password"
						className="mb-1 block text-sm font-medium text-foreground"
					>
						Confirm Password
					</label>
					<input
						id="signup-confirm-password"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
						minLength={12}
						autoComplete="new-password"
						className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						placeholder="Confirm password"
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
					{isLoading ? "Creating account..." : "Create Account"}
				</button>

				<button
					type="button"
					onClick={() => {
						window.location.href = buildAuthPageHref("/login", {
							sessionId: anonymousSessionId,
							redirectTo,
						});
					}}
					className="min-h-11 w-full rounded-xl bg-transparent text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
				>
					Already exploring? Sign in
				</button>
			</form>
		</div>
	);
}
