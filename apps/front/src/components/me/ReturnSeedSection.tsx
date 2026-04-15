import { Button } from "@workspace/ui/components/button";
import { Bell, Loader2, MoonStar } from "lucide-react";
import { useState } from "react";

export const FIRST_DAILY_PROMPT_HOUR = 19;

export function getFirstDailyPromptSchedule(now = new Date()) {
	const scheduledFor = new Date(now);
	scheduledFor.setDate(scheduledFor.getDate() + 1);
	scheduledFor.setHours(FIRST_DAILY_PROMPT_HOUR, 0, 0, 0);
	return scheduledFor;
}

type ReturnSeedState = "idle" | "requesting" | "granted" | "declined" | "unsupported" | "error";

interface ReturnSeedSectionProps {
	onPermissionGranted: (scheduledFor: Date) => Promise<void>;
	onDecline?: () => void;
}

const RETURN_SEED_HEADING_ID = "return-seed-heading";

export function ReturnSeedSection({ onPermissionGranted, onDecline }: ReturnSeedSectionProps) {
	const [state, setState] = useState<ReturnSeedState>("idle");

	const handleAccept = async () => {
		if (typeof window === "undefined" || typeof Notification === "undefined") {
			onDecline?.();
			setState("unsupported");
			return;
		}

		setState("requesting");

		try {
			const permission = await Notification.requestPermission();

			if (permission !== "granted") {
				onDecline?.();
				setState("declined");
				return;
			}

			await onPermissionGranted(getFirstDailyPromptSchedule());
			setState("granted");
		} catch {
			setState("error");
		}
	};

	const handleDecline = () => {
		onDecline?.();
		setState("declined");
	};

	const showActions = state === "idle" || state === "requesting" || state === "error";

	return (
		// biome-ignore lint/a11y/useSemanticElements: Story 2.5 requires an explicit role="region" selector here.
		<div
			aria-labelledby={RETURN_SEED_HEADING_ID}
			role="region"
			data-slot="return-seed-section"
			data-state={state}
			data-testid="return-seed-card"
			className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.85)] sm:p-8"
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_32%)]"
			/>
			<div className="relative space-y-6">
				<div className="flex items-start gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background/80 text-primary">
						<MoonStar className="size-5" aria-hidden="true" />
					</div>
					<div className="space-y-3">
						<p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
							A quiet return
						</p>
						<h2 id={RETURN_SEED_HEADING_ID} className="font-heading text-2xl font-bold text-foreground">
							Tomorrow, I&apos;ll ask how you&apos;re doing. Come check in with me.
						</h2>
						<p className="max-w-2xl text-base leading-7 text-foreground/80">
							I&apos;d like to check in with you tomorrow. Mind if I send a quiet note?
						</p>
					</div>
				</div>

				{showActions ? (
					<div className="flex flex-col gap-3 sm:flex-row">
						<Button
							type="button"
							onClick={() => void handleAccept()}
							disabled={state === "requesting"}
							data-testid="return-seed-accept"
							className="min-h-11 rounded-full px-5"
						>
							{state === "requesting" ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
									Listening for that quiet note...
								</>
							) : (
								<>
									<Bell className="mr-2 size-4" aria-hidden="true" />
									Yes, send me a quiet note
								</>
							)}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={handleDecline}
							disabled={state === "requesting"}
							data-testid="return-seed-decline"
							className="min-h-11 rounded-full px-5"
						>
							Not right now
						</Button>
					</div>
				) : null}

				{state === "granted" ? (
					<p
						aria-live="polite"
						data-testid="return-seed-feedback"
						className="text-sm leading-6 text-foreground/75"
					>
						I&apos;ll send a quiet note tomorrow evening.
					</p>
				) : null}

				{state === "declined" ? (
					<p
						aria-live="polite"
						data-testid="return-seed-feedback"
						className="text-sm leading-6 text-foreground/75"
					>
						That&apos;s alright. Come back tomorrow when it feels right.
					</p>
				) : null}

				{state === "unsupported" ? (
					<p
						aria-live="polite"
						data-testid="return-seed-feedback"
						className="text-sm leading-6 text-foreground/75"
					>
						Quiet notes aren&apos;t available in this browser yet, but I&apos;ll still be here tomorrow.
					</p>
				) : null}

				{state === "error" ? (
					<p
						aria-live="polite"
						data-testid="return-seed-feedback"
						className="text-sm leading-6 text-destructive"
					>
						I couldn&apos;t save that quiet note just now. You can try once more, or come back tomorrow on
						your own.
					</p>
				) : null}
			</div>
		</div>
	);
}
