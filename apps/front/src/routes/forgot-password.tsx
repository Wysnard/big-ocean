/**
 * Forgot Password Page (Story 31-7b)
 *
 * Email input form that triggers a password reset email.
 * Always shows success message after submission to prevent email enumeration.
 * Redirects authenticated users to /profile.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient, getSession } from "../lib/auth-client";
import { OceanShapeSet } from "../components/ocean-shapes";

export const Route = createFileRoute("/forgot-password")({
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (session?.user) {
			throw redirect({ to: "/profile" });
		}
	},
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await authClient.requestPasswordReset({
				email,
				redirectTo: "/reset-password",
			});
		} catch {
			// Silently handle — always show success to prevent email enumeration
		} finally {
			setIsLoading(false);
			setIsSubmitted(true);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="w-full max-w-md">
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
						<span className="font-heading text-lg font-bold tracking-tight text-foreground">
							big-
						</span>
						<OceanShapeSet size={12} />
					</div>

					{/* Heading */}
					<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
						Reset your{" "}
						<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
							password
						</span>
					</h2>
					<p className="mt-2 mb-6 text-sm text-muted-foreground">
						{isSubmitted
							? "If an account exists with that email, we sent a reset link."
							: "Enter your email and we'll send you a link to reset your password."}
					</p>

					{isSubmitted ? (
						<div className="space-y-4">
							<div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-3 text-sm text-foreground">
								Check your inbox for a password reset link. It may take a minute to arrive.
							</div>

							<a
								href="/login"
								className="mt-3 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-foreground font-heading text-base font-bold tracking-tight text-background transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.99]"
							>
								Back to Sign In
							</a>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label
									htmlFor="forgot-email"
									className="mb-1 block text-sm font-medium text-foreground"
								>
									Email
								</label>
								<input
									id="forgot-email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									autoComplete="email"
									className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									placeholder="you@example.com"
								/>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="mt-3 min-h-[52px] w-full rounded-xl bg-foreground font-heading text-base font-bold tracking-tight text-background transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
							>
								{isLoading && (
									<Loader2 className="mr-2 inline h-4 w-4 motion-safe:animate-spin" />
								)}
								{isLoading ? "Sending..." : "Send Reset Link"}
							</button>

							<a
								href="/login"
								className="flex min-h-11 w-full items-center justify-center rounded-xl bg-transparent text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
							>
								Back to Sign In
							</a>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
