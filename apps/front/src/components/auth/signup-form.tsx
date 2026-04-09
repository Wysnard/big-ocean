/**
 * Signup Form Component
 *
 * Email/password registration with Better Auth.
 * Uses TanStack Form + shadcn Field components.
 */

import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { OceanSpinner } from "@workspace/ui/components/ocean-spinner";
import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";

interface SignupFormProps {
	anonymousSessionId?: string;
	redirectTo?: string;
}

export function SignupForm({ anonymousSessionId, redirectTo }: SignupFormProps) {
	const { signUp } = useAuth();
	const navigate = useNavigate();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const errorId = "signup-form-error";

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		validators: {
			onSubmit: ({ value }) => {
				const errors: Record<string, string> = {};
				if (!value.name.trim()) {
					errors.name = "Name is required";
				}
				if (!value.email.trim()) {
					errors.email = "Email is required";
				}
				if (value.password.length < 12) {
					errors.password = "Password must be at least 12 characters";
				}
				if (value.password !== value.confirmPassword) {
					errors.confirmPassword = "Passwords do not match";
				}
				return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
			},
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			setIsLoading(true);

			try {
				await signUp.email(
					value.email,
					value.password,
					value.name,
					anonymousSessionId,
					`${window.location.origin}/dashboard`,
				);

				await navigate({
					to: "/verify-email",
					search: { email: value.email, error: undefined },
				});
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);
				if (errorMessage.includes("already exists")) {
					setServerError("An account with this email already exists");
				} else if (
					errorMessage.includes("data breach") ||
					errorMessage.includes("compromised") ||
					errorMessage.includes("PASSWORD_COMPROMISED")
				) {
					setServerError(
						"This password has appeared in a data breach. Please choose a different password.",
					);
				} else {
					setServerError(errorMessage || "Sign up failed. Please try again.");
				}
			} finally {
				setIsLoading(false);
			}
		},
	});

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
				<OceanHieroglyphSet size={12} />
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

			<form
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				{serverError && (
					<p
						id={errorId}
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{serverError}
					</p>
				)}

				<form.Field name="name">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						const fieldErrorId = "signup-name-error";
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="signup-name">Name</FieldLabel>
								<Input
									id="signup-name"
									type="text"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									autoComplete="name"
									placeholder="Your name"
									required
									aria-invalid={isInvalid}
									aria-describedby={
										[isInvalid ? fieldErrorId : null, serverError ? errorId : null]
											.filter(Boolean)
											.join(" ") || undefined
									}
									className="min-h-11 rounded-xl border-border bg-card px-4 py-3"
								/>
								{isInvalid && (
									<FieldError
										id={fieldErrorId}
										errors={field.state.meta.errors.map((e) => ({ message: String(e) }))}
									/>
								)}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="email">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						const fieldErrorId = "signup-email-error";
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="signup-email">Email</FieldLabel>
								<Input
									id="signup-email"
									type="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									autoComplete="email"
									placeholder="you@example.com"
									required
									aria-invalid={isInvalid}
									aria-describedby={
										[isInvalid ? fieldErrorId : null, serverError ? errorId : null]
											.filter(Boolean)
											.join(" ") || undefined
									}
									className="min-h-11 rounded-xl border-border bg-card px-4 py-3"
								/>
								{isInvalid && (
									<FieldError
										id={fieldErrorId}
										errors={field.state.meta.errors.map((e) => ({ message: String(e) }))}
									/>
								)}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="password">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						const fieldErrorId = "signup-password-error";
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="signup-password">Password</FieldLabel>
								<Input
									id="signup-password"
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									autoComplete="new-password"
									placeholder="At least 12 characters"
									required
									aria-invalid={isInvalid}
									aria-describedby={
										[isInvalid ? fieldErrorId : null, serverError ? errorId : null, "signup-password-help"]
											.filter(Boolean)
											.join(" ") || undefined
									}
									className="min-h-11 rounded-xl border-border bg-card px-4 py-3"
								/>
								<p id="signup-password-help" className="text-xs text-muted-foreground">
									Minimum 12 characters
								</p>
								{isInvalid && (
									<FieldError
										id={fieldErrorId}
										errors={field.state.meta.errors.map((e) => ({ message: String(e) }))}
									/>
								)}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="confirmPassword">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						const fieldErrorId = "signup-confirm-password-error";
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="signup-confirm-password">Confirm Password</FieldLabel>
								<Input
									id="signup-confirm-password"
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									autoComplete="new-password"
									placeholder="Confirm password"
									required
									aria-invalid={isInvalid}
									aria-describedby={
										[isInvalid ? fieldErrorId : null, serverError ? errorId : null]
											.filter(Boolean)
											.join(" ") || undefined
									}
									className="min-h-11 rounded-xl border-border bg-card px-4 py-3"
								/>
								{isInvalid && (
									<FieldError
										id={fieldErrorId}
										errors={field.state.meta.errors.map((e) => ({ message: String(e) }))}
									/>
								)}
							</Field>
						);
					}}
				</form.Field>

				<button
					type="submit"
					disabled={isLoading}
					className="mt-3 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-foreground font-heading text-base font-bold tracking-tight text-background transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
				>
					{isLoading && <OceanSpinner size={16} mono />}
					{isLoading ? "Creating account..." : "Create Account"}
				</button>

				<Link
					to="/login"
					search={{
						sessionId: anonymousSessionId,
						redirectTo,
					}}
					className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-transparent text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
				>
					Already exploring? Sign in
				</Link>
			</form>
		</div>
	);
}
