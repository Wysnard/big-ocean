import { cn } from "@workspace/ui/lib/utils";

const COPY = "Nerin will write you a letter about your week on Sunday.";

export interface QuietAnticipationLineProps {
	/** For tests: calendar day 0 = Sunday … 6 = Saturday (same as `Date#getDay()`). */
	referenceDate?: Date;
	className?: string;
}

/** Hidden on Sunday — Epic 5 weekly letter card replaces this slot. */
export function QuietAnticipationLine({ referenceDate, className }: QuietAnticipationLineProps) {
	const day = (referenceDate ?? new Date()).getDay();
	if (day === 0) {
		return null;
	}

	return (
		<p
			className={cn("text-center text-sm leading-relaxed text-muted-foreground", className)}
			data-slot="quiet-anticipation-line"
			data-testid="quiet-anticipation-line"
		>
			{COPY}
		</p>
	);
}
