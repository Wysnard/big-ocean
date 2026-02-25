/**
 * Waitlist Form (Story 15.3)
 *
 * Shown when global assessment circuit breaker is active.
 * Captures email for waitlist — no authentication required.
 */

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function WaitlistForm() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
	const [errorMessage, setErrorMessage] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus("submitting");
		setErrorMessage("");

		try {
			const res = await fetch(`${API_URL}/api/waitlist/signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({ message: "Something went wrong" }));
				throw new Error(data.message || `Request failed: ${res.status}`);
			}

			setStatus("success");
		} catch (err) {
			setStatus("error");
			setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
		}
	};

	if (status === "success") {
		return (
			<div
				className="h-[calc(100dvh-3.5rem)] flex items-center justify-center bg-background"
				data-testid="waitlist-success"
			>
				<div className="text-center max-w-md px-6">
					<div className="text-4xl mb-4">🌊</div>
					<h2 className="text-xl font-heading font-bold text-foreground">You're on the list!</h2>
					<p className="mt-2 text-muted-foreground">
						We'll let you know when a spot opens up. Check back tomorrow — the ocean resets at midnight
						UTC.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className="h-[calc(100dvh-3.5rem)] flex items-center justify-center bg-background"
			data-slot="waitlist-form"
			data-testid="waitlist-form"
		>
			<div className="text-center max-w-md px-6">
				<div className="text-4xl mb-4">🌊</div>
				<h2 className="text-xl font-heading font-bold text-foreground">Today's dive slots are full</h2>
				<p className="mt-3 text-muted-foreground">
					We limit daily assessments to keep the experience meaningful. Join the waitlist and we'll let
					you know when spots open up.
				</p>

				<form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="your@email.com"
						required
						className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						data-testid="waitlist-email-input"
					/>
					<button
						type="submit"
						disabled={status === "submitting"}
						className="min-h-[48px] rounded-xl bg-foreground px-8 font-heading text-base font-bold text-background transition-all hover:bg-primary hover:shadow-lg disabled:opacity-50"
						data-testid="waitlist-submit-button"
					>
						{status === "submitting" ? "Joining..." : "Join the waitlist"}
					</button>
				</form>

				{status === "error" && (
					<p className="mt-3 text-sm text-destructive" data-testid="waitlist-error">
						{errorMessage}
					</p>
				)}

				<p className="mt-4 text-xs text-muted-foreground">Slots reset daily at midnight UTC.</p>
			</div>
		</div>
	);
}
