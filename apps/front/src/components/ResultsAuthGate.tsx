import { type OceanCode5, OceanCode5Schema, TEASER_TRAIT_LETTERS } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { ResultsSignInForm } from "./auth/ResultsSignInForm";
import { ResultsSignUpForm } from "./auth/ResultsSignUpForm";
import { GeometricSignature } from "./ocean-shapes/GeometricSignature";

interface ResultsAuthGateProps {
	sessionId: string;
	expired?: boolean;
	onAuthSuccess: () => void;
	onStartFresh: () => void;
}

type GateMode = "teaser" | "signup" | "signin";

const TEASER_ARCHETYPE_MASK = "The ••••••••••";

function getTeaserOceanCode(sessionId: string): OceanCode5 {
	const hashSeed = sessionId
		.split("")
		.reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

	const code = TEASER_TRAIT_LETTERS.map((letters, index) => {
		const value = (hashSeed + index * 7) % letters.length;
		return letters[value];
	}).join("");

	return OceanCode5Schema.make(code);
}

export function ResultsAuthGate({
	sessionId,
	expired = false,
	onAuthSuccess,
	onStartFresh,
}: ResultsAuthGateProps) {
	const [mode, setMode] = useState<GateMode>("teaser");
	const teaserOceanCode = useMemo(() => getTeaserOceanCode(sessionId), [sessionId]);

	if (expired && mode === "teaser") {
		return (
			<section
				data-slot="results-auth-gate"
				className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-4xl items-center px-4 py-8 sm:px-6"
			>
				<div className="w-full rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<Lock className="h-5 w-5" />
					</div>
					<h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
						This Results Unlock Window Expired
					</h1>
					<p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
						For privacy, your saved teaser session is only available for 24 hours. You can sign up to
						start a fresh assessment or begin again anonymously.
					</p>
					<div className="mt-6 flex flex-col gap-3">
						<Button type="button" className="min-h-11 font-heading" onClick={() => setMode("signup")}>
							Sign Up to Start Fresh
						</Button>
						<Button type="button" variant="ghost" className="min-h-11" onClick={() => setMode("signin")}>
							Sign In
						</Button>
						<Button type="button" variant="outline" className="min-h-11" onClick={onStartFresh}>
							Start Fresh Assessment
						</Button>
					</div>
				</div>
			</section>
		);
	}

	if (mode === "teaser") {
		return (
			<section
				data-slot="results-auth-gate"
				className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-4xl items-center px-4 py-8 sm:px-6"
			>
				<div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
					<div className="mx-auto max-w-xl text-center">
						<div className="mb-5 flex justify-center">
							<GeometricSignature
								oceanCode={teaserOceanCode}
								animate
								baseSize={36}
								className="motion-reduce:animate-none!"
							/>
						</div>
						<p className="font-heading text-sm uppercase tracking-wide text-muted-foreground">
							Your Geometric Personality Signature
						</p>
						<p className="mt-2 inline-block rounded-md border border-border bg-muted px-4 py-2 font-display text-xl text-foreground/70 blur-sm select-none">
							{TEASER_ARCHETYPE_MASK}
						</p>
						<h1 className="mt-5 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
							Your Personality Profile is Ready!
						</h1>
						<div className="mt-6 flex flex-col gap-3">
							<Button
								type="button"
								data-slot="results-auth-gate-signup-cta"
								data-testid="auth-gate-signup-cta"
								className="min-h-11 font-heading"
								onClick={() => setMode("signup")}
							>
								Sign Up to See Your Results
							</Button>
							<Button
								type="button"
								data-slot="results-auth-gate-signin-cta"
								data-testid="auth-gate-signin-cta"
								variant="ghost"
								className="min-h-11"
								onClick={() => setMode("signin")}
							>
								Already have an account? Sign In
							</Button>
						</div>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section
			data-slot="results-auth-gate"
			className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-4xl items-center px-4 py-8 sm:px-6"
		>
			<div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
				{mode === "signup" ? (
					<ResultsSignUpForm
						sessionId={expired ? undefined : sessionId}
						onSuccess={onAuthSuccess}
						onSwitchToSignIn={() => setMode("signin")}
					/>
				) : (
					<ResultsSignInForm
						sessionId={expired ? undefined : sessionId}
						onSuccess={onAuthSuccess}
						onSwitchToSignUp={() => setMode("signup")}
					/>
				)}

				<div className="mx-auto mt-4 max-w-md">
					<Button type="button" variant="outline" className="min-h-11 w-full" onClick={onStartFresh}>
						Start Fresh Assessment
					</Button>
				</div>
			</div>
		</section>
	);
}
