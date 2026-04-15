import { Link } from "@tanstack/react-router";
import { WEEKLY_LETTER_HEADLINE, type WeekGridResponse } from "@workspace/contracts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { getWeekIdForLocalDate } from "@/hooks/use-today-check-in";

/** Local calendar Sunday for `YYYY-MM-DD` (same interpretation as check-in dates). */
function isSundayLocalDate(localDate: string): boolean {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
	if (!match) {
		return false;
	}
	const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return d.getDay() === 0;
}

export interface WeeklyLetterCardProps {
	readonly localDate: string;
	readonly weekGrid: WeekGridResponse;
	readonly className?: string;
}

/**
 * Inline entry to the weekly letter on Sundays when generation completed (Epic 5.3).
 */
export function WeeklyLetterCard({ localDate, weekGrid, className }: WeeklyLetterCardProps) {
	if (!isSundayLocalDate(localDate)) {
		return null;
	}

	if (weekGrid.weeklyLetter.status !== "ready") {
		return null;
	}

	const weekId = getWeekIdForLocalDate(localDate);

	return (
		<Link
			to="/today/week/$weekId"
			params={{ weekId }}
			className={cn(
				"block min-h-[44px] rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
			data-testid="weekly-letter-card"
		>
			<Card className="border-primary/35 bg-primary/5 shadow-sm transition-colors hover:bg-primary/10">
				<CardHeader className="space-y-1 border-0 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
					<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
						This week
					</p>
					<CardTitle className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						{WEEKLY_LETTER_HEADLINE}
					</CardTitle>
					<CardDescription className="text-sm leading-6">
						Tap to read Nerin&apos;s letter.
					</CardDescription>
				</CardHeader>
				<CardContent className="px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
					<span className="text-sm font-medium text-primary">Open letter →</span>
				</CardContent>
			</Card>
		</Link>
	);
}
