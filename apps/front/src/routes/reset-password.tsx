/**
 * Reset Password Page (Story 31-7b)
 *
 * Reads token from URL search params. Displays a new password form.
 * On success, redirects to /login.
 * Better Auth redirects here with ?token=VALID_TOKEN or ?error=INVALID_TOKEN.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { OceanShapeSet } from "../components/ocean-shapes";

export const Route = createFileRoute("/reset-password")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: typeof search.token === "string" ? search.token : undefined,
		error: typeof search.error === "string" ? search.error : undefined,
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token, error: urlError } = Route.useSearch();
	const navigate = useNavigate();
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(
		urlError === "INVALID_TOKEN" ? "This reset link is invalid or has expired." : null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const errorId = "reset-password-error";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (newPassword !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		if (newPassword.length < 12) {
			setError("Password must be at least 12 characters.");
			return;
		}

		if (!token) {
			setError("Missing reset token. Please request a new password reset link.");
			return;
		}

		setIsLoading(true);

		try {
			const result = await authClient.resetPassword({
				newPassword,
				token,
			});

			if (result.error) {
				setError(result.error.message || "Failed to reset password. The link may have expired.");
			} else {
				setIsSuccess(true);
				// Redirect to login after short delay
				setTimeout(() => {
					void navigate({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
				}, 2000);
			}
		} catch {
			setError("Failed to reset password. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const hasValidToken = !!token && urlError !== "INVALID_TOKEN";

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
						New{" "}
						<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
							password
						</span>
					</h2>
					<p className="mt-2 mb-6 text-sm text-muted-foreground">
						{isSuccess
							? "Your password has been reset. Redirecting to sign in..."
							: "Choose a new password for your account."}
					</p>

					{isSuccess ? (
						<div className="space-y-4">
							<div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-3 text-sm text-foreground">
								Password reset successfully. Redirecting...
							</div>
						</div>
					) : !hasValidToken ? (
						<div className="space-y-4">
							{error && (
								<p
									role="alert"
									className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
								>
									{error}
								</p>
							)}

							<a
								href="/forgot-password"
								className="mt-3 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-foreground font-heading text-base font-bold tracking-tight text-background transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.99]"
							>
								Request New Reset Link
							</a>
						</div>
					) : (
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
								<label
									htmlFor="reset-new-password"
									className="mb-1 block text-sm font-medium text-foreground"
								>
									New Password
								</label>
								<input
									id="reset-new-password"
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									required
									minLength={12}
									autoComplete="new-password"
									className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									placeholder="At least 12 characters"
									aria-invalid={!!error}
									aria-describedby={error ? errorId : "reset-password-help"}
								/>
								<p id="reset-password-help" className="mt-1 text-xs text-muted-foreground">
									Minimum 12 characters
								</p>
							</div>

							<div>
								<label
									htmlFor="reset-confirm-password"
									className="mb-1 block text-sm font-medium text-foreground"
								>
									Confirm Password
								</label>
								<input
									id="reset-confirm-password"
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
								{isLoading && (
									<Loader2 className="mr-2 inline h-4 w-4 motion-safe:animate-spin" />
								)}
								{isLoading ? "Resetting..." : "Reset Password"}
							</button>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
