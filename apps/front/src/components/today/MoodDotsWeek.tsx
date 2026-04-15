import type { WeekGridResponse } from "@workspace/contracts";
import { cn } from "@workspace/ui/lib/utils";

const SHORT_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const WEEKDAY_NAMES = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
] as const;

export interface MoodDotsWeekProps {
	localDate: string;
	weekGrid: WeekGridResponse | undefined;
	isLoading?: boolean;
	isError?: boolean;
	className?: string;
}

function dotAriaLabel(dayIndex: number, hasCheckIn: boolean) {
	const name = WEEKDAY_NAMES[dayIndex];
	return hasCheckIn ? `${name}: checked in` : `${name}: no check-in`;
}

export function MoodDotsWeek({
	localDate,
	weekGrid,
	isLoading = false,
	isError = false,
	className,
}: MoodDotsWeekProps) {
	if (isLoading) {
		return (
			<div
				className={cn("w-full", className)}
				data-slot="mood-dots-week"
				data-testid="mood-dots-week"
				data-state="loading"
				aria-busy="true"
			>
				<ul className="flex list-none justify-between gap-1 px-1 sm:gap-2">
					{WEEKDAY_NAMES.map((weekdayName, i) => {
						const label = SHORT_LABELS[i] ?? "?";
						return (
							<li key={`sk-${weekdayName}`} className="flex flex-1 flex-col items-center gap-2">
								<div className="h-3 w-3 rounded-full bg-muted motion-safe:animate-pulse motion-reduce:animate-none sm:h-3.5 sm:w-3.5" />
								<span className="text-[0.65rem] font-medium text-muted-foreground/80 sm:text-xs">
									{label}
								</span>
							</li>
						);
					})}
				</ul>
			</div>
		);
	}

	const days = weekGrid?.days ?? [];

	if (days.length !== 7 || isError) {
		return (
			<div
				className={cn("w-full", className)}
				data-slot="mood-dots-week"
				data-testid="mood-dots-week"
				data-state="fallback"
			>
				<p className="sr-only">Week mood view unavailable</p>
				<ul className="flex list-none justify-between gap-1 px-1 sm:gap-2">
					{WEEKDAY_NAMES.map((weekdayName, i) => {
						const label = SHORT_LABELS[i] ?? "?";
						return (
							<li key={`fb-${weekdayName}`} className="flex flex-1 flex-col items-center gap-2">
								<span
									className="inline-block h-3 w-3 rounded-full border border-dashed border-muted-foreground/35 sm:h-3.5 sm:w-3.5"
									aria-hidden
								/>
								<span className="text-[0.65rem] font-medium text-muted-foreground/60 sm:text-xs">
									{label}
								</span>
							</li>
						);
					})}
				</ul>
			</div>
		);
	}

	return (
		<div
			className={cn("w-full", className)}
			data-slot="mood-dots-week"
			data-testid="mood-dots-week"
			data-state="ready"
		>
			<ul className="flex list-none justify-between gap-1 px-1 sm:gap-2">
				{days.map((day, index) => {
					const hasCheckIn = day.checkIn != null;
					const isToday = day.localDate === localDate;
					const label = SHORT_LABELS[index] ?? "?";

					return (
						<li key={day.localDate} className="flex flex-1 flex-col items-center gap-2">
							<span className="sr-only">{dotAriaLabel(index, hasCheckIn)}</span>
							<span
								className={cn(
									"inline-flex h-3 w-3 items-center justify-center rounded-full sm:h-3.5 sm:w-3.5",
									hasCheckIn ? "bg-primary shadow-sm" : "border border-muted-foreground/40 bg-transparent",
									isToday && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
								)}
								aria-hidden
							/>
							<span className="text-[0.65rem] font-medium text-muted-foreground sm:text-xs" aria-hidden>
								{label}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
