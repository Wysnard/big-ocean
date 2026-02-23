import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { NerinMessage } from "@workspace/ui/components/chat";
import { useEffect, useState } from "react";
import {
	clearPendingResultsGateSession,
	persistPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";
import { ResultsSignInForm } from "./auth/ResultsSignInForm";
import { ResultsSignUpForm } from "./auth/ResultsSignUpForm";

interface ChatAuthGateProps {
	sessionId: string;
}

/**
 * Nerin-themed auth gate that appears inline in the chat below the farewell message.
 * Displays as a continuation of the conversation (AC #3) — not a system interruption.
 * Shows sign-up/sign-in forms that link the anonymous session to the new/existing account.
 * Persists sessionId to localStorage so anonymous users can return within 24h (AC #6).
 */
export function ChatAuthGate({ sessionId }: ChatAuthGateProps) {
	const [mode, setMode] = useState<"gate" | "signup" | "signin">("gate");
	const navigate = useNavigate();

	// AC #6: Persist sessionId so anonymous users can return within 24h
	useEffect(() => {
		persistPendingResultsGateSession(sessionId);
	}, [sessionId]);

	const handleAuthSuccess = () => {
		clearPendingResultsGateSession(sessionId);

		// Story 11.1: Navigate to finalize route after auth — triggers generate-results
		navigate({
			to: "/finalize/$assessmentSessionId",
			params: { assessmentSessionId: sessionId },
		});
	};

	return (
		<div data-slot="chat-auth-gate" className="relative z-1 mb-9 motion-safe:animate-fade-in-up">
			<NerinMessage>
				<p>Create an account so your portrait is here when it's ready.</p>
			</NerinMessage>

			{mode === "gate" && (
				<div className="mt-4 flex flex-col gap-3 items-center max-w-sm mx-auto">
					<Button
						onClick={() => setMode("signup")}
						className="w-full min-h-[48px]"
						data-testid="chat-auth-gate-signup-btn"
					>
						Sign Up
					</Button>
					<button
						type="button"
						onClick={() => setMode("signin")}
						className="min-h-11 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
						data-testid="chat-auth-gate-signin-btn"
					>
						Already have an account? Sign In
					</button>
				</div>
			)}

			{mode === "signup" && (
				<div className="mt-4">
					<ResultsSignUpForm
						sessionId={sessionId}
						onSuccess={handleAuthSuccess}
						onSwitchToSignIn={() => setMode("signin")}
					/>
				</div>
			)}

			{mode === "signin" && (
				<div className="mt-4">
					<ResultsSignInForm
						sessionId={sessionId}
						onSuccess={handleAuthSuccess}
						onSwitchToSignUp={() => setMode("signup")}
					/>
				</div>
			)}
		</div>
	);
}
