import type { CheckInResponse } from "@workspace/contracts";
import { cn } from "@workspace/ui/lib/utils";
import { useId } from "react";
import { getMoodMeta } from "./today-mood-meta";

function formatDisplayDate(isoLocalDate: string) {
	try {
		const [y, m, d] = isoLocalDate.split("-").map(Number);
		if (!y || !m || !d) {
			return isoLocalDate;
		}
		return new Date(y, m - 1, d).toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return isoLocalDate;
	}
}

export interface JournalEntryProps {
	checkIn: CheckInResponse;
	className?: string;
	/** Screen-reader-only article title. Defaults to today's-journal wording for the main Today flow. */
	srOnlyHeading?: string;
}

/**
 * User-only check-in in journal layout (not chat). Free tier: no Nerin margin note.
 */
export function JournalEntry({
	checkIn,
	className,
	srOnlyHeading = "Today's check-in",
}: JournalEntryProps) {
	const headingId = useId();
	const mood = getMoodMeta(checkIn.mood);
	const displayDate = formatDisplayDate(checkIn.localDate);

	return (
		<article
			className={cn("w-full", className)}
			data-slot="journal-entry"
			data-testid="journal-entry"
			aria-labelledby={headingId}
		>
			<h2 id={headingId} className="sr-only">
				{srOnlyHeading}
			</h2>
			<div className="flex gap-4 sm:gap-5">
				<div
					className="flex shrink-0 select-none items-start justify-center rounded-2xl border border-border/60 bg-background/60 px-2.5 py-2 text-3xl leading-none sm:px-3 sm:py-2.5"
					aria-hidden
				>
					{mood.emoji}
				</div>
				<div className="min-w-0 flex-1 space-y-3">
					<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
						<time
							className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
							dateTime={checkIn.localDate}
						>
							{displayDate}
						</time>
					</div>
					<p className="font-sans text-sm font-medium text-foreground">{mood.label}</p>
					<div className="font-serif text-base leading-[1.7] text-foreground/90">
						{checkIn.note ? (
							<p className="whitespace-pre-wrap">{checkIn.note}</p>
						) : (
							<p className="text-muted-foreground italic">No note today.</p>
						)}
					</div>
					{checkIn.visibility === "private" ? (
						<p className="text-xs text-muted-foreground">
							<span className="sr-only">Private entry</span>
							<span aria-hidden>🔒</span> Private
						</p>
					) : null}
				</div>
			</div>
		</article>
	);
}
