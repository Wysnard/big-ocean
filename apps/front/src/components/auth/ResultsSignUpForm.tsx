import { useForm } from "@tanstack/react-form";
import { Schema as S } from "effect";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface ResultsSignUpFormProps {
	sessionId?: string;
	onSuccess: () => void;
	onSwitchToSignIn: () => void;
}

// Form schema using Effect Schema (Standard Schema format for TanStack Form)
const SignUpFormSchema = S.standardSchemaV1(
	S.Struct({
		email: S.String.pipe(
			S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
			S.annotations({
				message: () => "Please enter a valid email address.",
			}),
		),
		password: S.String.pipe(
			S.minLength(12),
			S.annotations({
				message: () => "Password must be at least 12 characters.",
			}),
		),
	}),
);

const formatValidationErrors = (errors: readonly unknown[]): string[] =>
	errors
		.map((error) => {
			if (typeof error === "string") {
				return error;
			}
			if (error instanceof Error) {
				return error.message;
			}
			if (
				typeof error === "object" &&
				error !== null &&
				"message" in error &&
				typeof (error as { message: unknown }).message === "string"
			) {
				return (error as { message: string }).message;
			}

			return String(error);
		})
		.filter((message) => message.length > 0);

export function ResultsSignUpForm({
	sessionId,
	onSuccess,
	onSwitchToSignIn,
}: ResultsSignUpFormProps) {
	const { signUp, refreshSession } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const errorId = "results-signup-error";

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: SignUpFormSchema,
		},
		onSubmit: async ({ value }) => {
			setError(null);

			try {
				await signUp.email(value.email, value.password, undefined, sessionId);
				await refreshSession();
				onSuccess();
			} catch (authError) {
				const message = authError instanceof Error ? authError.message : "Sign up failed.";
				setError(message);
			}
		},
	});

	return (
		<div className="mx-auto max-w-md">
			<h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
				Create your{" "}
				<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
					account
				</span>
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				Save this assessment to your account and reveal your full profile instantly.
			</p>

			<form
				className="mt-6 space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<form.Field
					name="email"
					// biome-ignore lint/correctness/noChildrenProp: TanStack Form uses render props pattern
					children={(field) => {
						const fieldErrors = formatValidationErrors(field.state.meta.errors);
						return (
							<div>
								<label
									htmlFor="results-signup-email"
									className="mb-1 block text-sm font-medium text-foreground"
								>
									Email
								</label>
								<input
									id="results-signup-email"
									type="email"
									autoComplete="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									placeholder="you@example.com"
									aria-invalid={fieldErrors.length > 0 || !!error}
									aria-describedby={fieldErrors.length > 0 || error ? errorId : undefined}
									required
								/>
								{fieldErrors.length > 0 && (
									<p role="alert" className="mt-1 text-xs text-destructive">
										{fieldErrors.join(", ")}
									</p>
								)}
							</div>
						);
					}}
				/>

				<form.Field
					name="password"
					// biome-ignore lint/correctness/noChildrenProp: TanStack Form uses render props pattern
					children={(field) => {
						const fieldErrors = formatValidationErrors(field.state.meta.errors);
						return (
							<div>
								<label
									htmlFor="results-signup-password"
									className="mb-1 block text-sm font-medium text-foreground"
								>
									Password
								</label>
								<input
									id="results-signup-password"
									type="password"
									autoComplete="new-password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									placeholder="At least 12 characters"
									aria-invalid={fieldErrors.length > 0 || !!error}
									aria-describedby={
										fieldErrors.length > 0 || error ? errorId : "results-signup-password-help"
									}
									required
								/>
								{fieldErrors.length > 0 && (
									<p role="alert" className="mt-1 text-xs text-destructive">
										{fieldErrors.join(", ")}
									</p>
								)}
								{fieldErrors.length === 0 && (
									<p id="results-signup-password-help" className="mt-1 text-xs text-muted-foreground">
										Minimum 12 characters
									</p>
								)}
							</div>
						);
					}}
				/>

				{error && (
					<p
						id={errorId}
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</p>
				)}

				<form.Subscribe
					selector={(state) => [state.isSubmitting]}
					// biome-ignore lint/correctness/noChildrenProp: TanStack Form uses render props pattern
					children={([isSubmitting]) => (
						<button
							type="submit"
							data-testid="auth-gate-signup-submit"
							disabled={isSubmitting}
							className="mt-3 min-h-[52px] w-full rounded-xl bg-foreground font-heading text-base font-bold tracking-tight text-background transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
						>
							{isSubmitting && <Loader2 className="mr-2 inline h-4 w-4 motion-safe:animate-spin" />}
							Create Account and Reveal Results
						</button>
					)}
				/>

				<button
					type="button"
					onClick={onSwitchToSignIn}
					className="min-h-11 w-full rounded-xl bg-transparent text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
				>
					Already have an account? Sign In
				</button>
			</form>
		</div>
	);
}
