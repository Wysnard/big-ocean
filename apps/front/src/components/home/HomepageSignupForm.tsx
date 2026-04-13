/**
 * Homepage Signup Form
 *
 * Condensed signup form for the sticky auth panel.
 * Reuses form logic from signup-form.tsx without card wrapper or corner decorations.
 */

import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { OceanSpinner } from "@workspace/ui/components/ocean-spinner";
import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";

export function HomepageSignupForm() {
	const { signUp } = useAuth();
	const navigate = useNavigate();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const errorId = "homepage-signup-error";

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
					undefined,
					`${window.location.origin}/today`,
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
		<form
			data-slot="homepage-signup-form"
			data-testid="homepage-signup-form"
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="w-full space-y-3"
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
					const fieldErrorId = "homepage-signup-name-error";
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor="homepage-signup-name">Name</FieldLabel>
							<Input
								id="homepage-signup-name"
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
					const fieldErrorId = "homepage-signup-email-error";
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor="homepage-signup-email">Email</FieldLabel>
							<Input
								id="homepage-signup-email"
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
					const fieldErrorId = "homepage-signup-password-error";
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor="homepage-signup-password">Password</FieldLabel>
							<Input
								id="homepage-signup-password"
								type="password"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								autoComplete="new-password"
								placeholder="At least 12 characters"
								required
								aria-invalid={isInvalid}
								aria-describedby={
									[
										isInvalid ? fieldErrorId : null,
										serverError ? errorId : null,
										"homepage-signup-password-help",
									]
										.filter(Boolean)
										.join(" ") || undefined
								}
								className="min-h-11 rounded-xl border-border bg-card px-4 py-3"
							/>
							<p id="homepage-signup-password-help" className="text-xs text-muted-foreground">
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
					const fieldErrorId = "homepage-signup-confirm-password-error";
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor="homepage-signup-confirm-password">Confirm Password</FieldLabel>
							<Input
								id="homepage-signup-confirm-password"
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
				data-testid="homepage-signup-submit"
				className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-heading text-base font-semibold text-white transition-[transform,box-shadow] duration-200 hover:translate-y-[-2px] hover:shadow-[0_8px_28px_rgba(255,0,128,.28)] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isLoading && <OceanSpinner size={16} mono />}
				{isLoading ? "Creating account..." : "Start yours \u2192"}
			</button>
		</form>
	);
}
