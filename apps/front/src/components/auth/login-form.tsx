/**
 * Login Form Component
 *
 * Email/password login with Better Auth.
 * Uses TanStack Form + shadcn Field components.
 */

import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { OceanSpinner } from "@workspace/ui/components/ocean-spinner";
import { useState } from "react";
import { AuthError, useAuth } from "../../hooks/use-auth";

interface LoginFormProps {
	redirectTo?: string;
	/** `embed` = compact block for homepage sticky panel; `page` = full `/login` route */
	variant?: "page" | "embed";
}

export function LoginForm({ redirectTo, variant = "page" }: LoginFormProps) {
	const isEmbed = variant === "embed";
	const { signIn, isPending } = useAuth();
	const navigate = useNavigate();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const errorId = "login-form-error";

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: ({ value }) => {
				const errors: Record<string, string> = {};
				if (!value.email.trim()) {
					errors.email = "Email is required";
				}
				if (value.password.length < 12) {
					errors.password = "Password must be at least 12 characters";
				}
				return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
			},
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			setIsLoading(true);

			try {
				await signIn.email(value.email, value.password);

				if (redirectTo?.startsWith("/")) {
					await navigate({ to: redirectTo });
				} else {
					await navigate({ to: "/today" });
				}
			} catch (err) {
				// 403 = email not verified — redirect to verify-email page (AC6, ADR-24)
				// Better Auth already auto-resent the verification email (sendOnSignIn: true)
				if (err instanceof AuthError && err.status === 403) {
					await navigate({
						to: "/verify-email",
						search: { email: value.email, error: undefined },
					});
					return;
				}
				// Always show generic message to avoid revealing whether email exists (AC #3)
				setServerError("Invalid email or password");
			} finally {
				setIsLoading(false);
			}
		},
	});

	if (isPending) {
		return (
			<div className="flex items-center justify-center p-6 text-muted-foreground">
				Checking authentication...
			</div>
		);
	}

	const formMarkup = (
		<>
			<form
				data-testid={isEmbed ? "login-form-embed" : undefined}
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

				<form.Field name="email">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						const fieldErrorId = "login-email-error";
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="login-email">Email</FieldLabel>
								<Input
									id="login-email"
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
						const fieldErrorId = "login-password-error";
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="login-password">Password</FieldLabel>
								<Input
									id="login-password"
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									autoComplete="current-password"
									placeholder="Your password"
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

				<div className="flex justify-end">
					<Link
						to="/forgot-password"
						className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
					>
						Forgot password?
					</Link>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="mt-3 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-foreground font-heading text-base font-bold tracking-tight text-background transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
				>
					{isLoading && <OceanSpinner size={16} mono />}
					{isLoading ? "Signing in..." : "Sign In"}
				</button>

				{!isEmbed && (
					<Link
						to="/signup"
						search={{
							redirectTo,
						}}
						className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-transparent text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
					>
						New here? Create account
					</Link>
				)}
			</form>
		</>
	);

	if (isEmbed) {
		return <div className="w-full">{formMarkup}</div>;
	}

	return (
		<Card className="relative mx-auto max-w-md gap-0 overflow-hidden rounded-lg border-border p-0 shadow-lg">
			<div className="pointer-events-none absolute -top-2.5 -right-2.5" aria-hidden="true">
				<div className="absolute top-4 right-4 h-11 w-11 rounded-full bg-trait-openness opacity-10" />
				<div
					className="absolute top-1 right-13 h-0 w-0 opacity-8"
					style={{
						borderLeft: "12px solid transparent",
						borderRight: "12px solid transparent",
						borderBottom: "20px solid var(--trait-agreeableness)",
					}}
				/>
			</div>

			<CardHeader className="relative flex flex-col gap-0 border-0 px-8 pt-8 pb-0 sm:px-10 sm:pt-10">
				<div className="mb-5 flex items-center gap-1">
					<span className="font-heading text-lg font-bold tracking-tight text-foreground">big-</span>
					<OceanHieroglyphSet size={12} />
				</div>

				<CardTitle className="font-heading text-3xl font-bold tracking-tight text-foreground">
					Welcome{" "}
					<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
						back
					</span>
				</CardTitle>
				<CardDescription className="mt-2 text-sm text-muted-foreground">
					Sign in to continue your journey.
				</CardDescription>
			</CardHeader>

			<CardContent className="relative px-8 pt-6 pb-8 sm:px-10 sm:pb-10">{formMarkup}</CardContent>
		</Card>
	);
}
