import { Link } from "@tanstack/react-router";
import type { WeekGridResponse } from "@workspace/contracts";
import { cn } from "@workspace/ui/lib/utils";
import { getWeekIdForLocalDate } from "@/hooks/use-today-check-in";
import { WeeklyLetterCardPresentation } from "./WeeklyLetterCardPresentation";

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
			<WeeklyLetterCardPresentation />
		</Link>
	);
}
