/**
 * Verify Email Page (Story 31-7b)
 *
 * Three states:
 * 1. Pending — "Check your inbox" with resend button
 * 2. Error — expired/invalid token with resend button
 * 3. Verified — success message with link to profile
 *
 * The email param is passed via search params so the resend button can work.
 */

import { createFileRoute } from "@tanstack/react-router";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/verify-email")({
	validateSearch: (search: Record<string, unknown>) => ({
		email: typeof search.email === "string" ? search.email : undefined,
		error: typeof search.error === "string" ? search.error : undefined,
	}),
	component: VerifyEmailPage,
});

function VerifyEmailPage() {
	const { email, error: urlError } = Route.useSearch();
	const [isResending, setIsResending] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);
	const [resendError, setResendError] = useState<string | null>(null);

	const hasError = !!urlError;

	const handleResend = async () => {
		if (!email) return;
		setIsResending(true);
		setResendError(null);
		setResendSuccess(false);

		try {
			await authClient.sendVerificationEmail({
				email,
				callbackURL: `${window.location.origin}/dashboard`,
			});
			setResendSuccess(true);
		} catch {
			setResendError("Failed to resend verification email. Please try again.");
		} finally {
			setIsResending(false);
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
						<span className="font-heading text-lg font-bold tracking-tight text-foreground">big-</span>
						<OceanHieroglyphSet size={12} />
					</div>

					{/* Heading */}
					<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
						Verify your{" "}
						<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
							email
						</span>
					</h2>

					{hasError ? (
						// Error state — token expired or invalid
						<div className="mt-6 space-y-4">
							<p className="text-sm text-muted-foreground">
								This verification link is invalid or has expired. Request a new one below.
							</p>

							{resendSuccess && (
								<div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
									Verification email sent! Check your inbox.
								</div>
							)}

							{resendError && (
								<p
									role="alert"
									className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
								>
									{resendError}
								</p>
							)}

							{email && (
								<button
									type="button"
									onClick={handleResend}
									disabled={isResending || resendSuccess}
									className="min-h-[52px] w-full rounded-xl bg-foreground font-heading text-base font-bold tracking-tight text-background transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
								>
									{isResending && <Loader2 className="mr-2 inline h-4 w-4 motion-safe:animate-spin" />}
									{isResending ? "Sending..." : "Resend Verification Email"}
								</button>
							)}

							<a
								href="/login"
								className="flex min-h-11 w-full items-center justify-center rounded-xl bg-transparent text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
							>
								Back to Sign In
							</a>
						</div>
					) : (
						// Pending state — check your inbox
						<div className="mt-6 space-y-4">
							<p className="text-sm text-muted-foreground">
								We sent a verification link to{" "}
								{email ? <strong className="text-foreground">{email}</strong> : "your email"}. Click the
								link to activate your account and start your journey with Nerin.
							</p>

							<div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-3 text-sm text-foreground">
								Check your inbox (and spam folder) for the verification email.
							</div>

							{resendSuccess && (
								<div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
									Verification email resent! Check your inbox.
								</div>
							)}

							{resendError && (
								<p
									role="alert"
									className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
								>
									{resendError}
								</p>
							)}

							{email && (
								<button
									type="button"
									onClick={handleResend}
									disabled={isResending || resendSuccess}
									className="min-h-11 w-full rounded-xl bg-transparent text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:text-muted-foreground/50"
								>
									{isResending && <Loader2 className="mr-2 inline h-4 w-4 motion-safe:animate-spin" />}
									{isResending ? "Sending..." : resendSuccess ? "Email sent" : "Resend verification email"}
								</button>
							)}

							<a
								href="/login"
								className="flex min-h-11 w-full items-center justify-center rounded-xl bg-transparent text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
							>
								Back to Sign In
							</a>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
