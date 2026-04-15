import type { CalendarMonthResponse } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { JournalEntry } from "./JournalEntry";
import { getMoodMeta } from "./today-mood-meta";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const formatDateLabel = (localDate: string) => {
	const [year, month, day] = localDate.split("-").map(Number);
	if (!year || !month || !day) {
		return localDate;
	}

	return new Date(year, month - 1, day).toLocaleDateString(undefined, {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
};

const getMonthHeading = (yearMonth: string) => {
	const [year, month] = yearMonth.split("-").map(Number);
	if (!year || !month) {
		return yearMonth;
	}

	return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
	});
};

const getMondayFirstOffset = (localDate: string) => {
	const [year, month, day] = localDate.split("-").map(Number);
	if (!year || !month || !day) {
		return 0;
	}

	const weekday = new Date(year, month - 1, day).getDay();
	return (weekday + 6) % 7;
};

export interface MoodCalendarViewProps {
	calendarMonth: CalendarMonthResponse | undefined;
	isLoading?: boolean;
	isError?: boolean;
	canGoForward: boolean;
	onPreviousMonth: () => void;
	onNextMonth: () => void;
	className?: string;
}

type CalendarCell = {
	readonly key: string;
	readonly day: CalendarMonthResponse["days"][number] | null;
};

const chunkCells = (cells: readonly CalendarCell[], size: number) =>
	Array.from({ length: Math.ceil(cells.length / size) }, (_, index) =>
		cells.slice(index * size, (index + 1) * size),
	);

export function MoodCalendarView({
	calendarMonth,
	isLoading = false,
	isError = false,
	canGoForward,
	onPreviousMonth,
	onNextMonth,
	className,
}: MoodCalendarViewProps) {
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	const isReady = !isLoading && !isError && calendarMonth !== undefined;
	const days = calendarMonth?.days ?? [];
	const leadingBlankCount = days[0] ? getMondayFirstOffset(days[0].localDate) : 0;

	const cells = useMemo((): CalendarCell[] => {
		if (!calendarMonth) {
			return [];
		}

		const leadingBlanks = Array.from({ length: leadingBlankCount }, (_, blankNumber) => ({
			key: `blank-start-${calendarMonth.yearMonth}-${blankNumber + 1}`,
			day: null,
		}));
		const currentMonthDays = days.map((day) => ({ key: day.localDate, day }));
		const trailingBlankCount = (7 - ((leadingBlanks.length + currentMonthDays.length) % 7 || 7)) % 7;
		const trailingBlanks = Array.from({ length: trailingBlankCount }, (_, blankNumber) => ({
			key: `blank-end-${calendarMonth.yearMonth}-${blankNumber + 1}`,
			day: null,
		}));

		return [...leadingBlanks, ...currentMonthDays, ...trailingBlanks];
	}, [calendarMonth, days, leadingBlankCount]);

	const weeks = useMemo(() => chunkCells(cells, 7), [cells]);

	const selectedDay = useMemo(() => {
		if (!isReady) {
			return null;
		}

		return days.find((day) => day.localDate === selectedDate && day.checkIn) ?? null;
	}, [days, isReady, selectedDate]);

	if (isLoading) {
		return (
			<section
				data-slot="mood-calendar-view"
				data-testid="mood-calendar-view"
				data-state="loading"
				aria-busy="true"
				className={cn("space-y-6", className)}
			>
				<div className="flex items-center justify-between gap-4">
					<div className="h-8 w-40 rounded-full bg-muted motion-safe:animate-pulse motion-reduce:animate-none" />
					<div className="flex gap-2">
						<div className="h-10 w-10 rounded-full bg-muted motion-safe:animate-pulse motion-reduce:animate-none" />
						<div className="h-10 w-10 rounded-full bg-muted motion-safe:animate-pulse motion-reduce:animate-none" />
					</div>
				</div>
				<div className="grid grid-cols-7 gap-2">
					{Array.from({ length: 35 }, (_, index) => `skeleton-${index + 1}`).map((skeletonKey) => (
						<div
							key={skeletonKey}
							className="aspect-square rounded-2xl bg-muted/70 motion-safe:animate-pulse motion-reduce:animate-none"
						/>
					))}
				</div>
			</section>
		);
	}

	if (isError || !calendarMonth) {
		return (
			<section
				data-slot="mood-calendar-view"
				data-testid="mood-calendar-view"
				data-state="error"
				className={cn("rounded-[2rem] border border-border bg-card p-6 shadow-sm", className)}
			>
				<p className="text-base leading-7 text-muted-foreground">
					We couldn&apos;t load your mood calendar right now. Try again in a moment.
				</p>
			</section>
		);
	}

	return (
		<section
			data-slot="mood-calendar-view"
			data-testid="mood-calendar-view"
			data-state="ready"
			className={cn("space-y-6", className)}
		>
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="font-heading text-2xl font-bold text-foreground">
						{getMonthHeading(calendarMonth.yearMonth)}
					</h2>
					<p className="text-sm text-muted-foreground">A quiet view of your check-ins over time.</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="rounded-full"
						onClick={onPreviousMonth}
						aria-label="Previous month"
					>
						<ChevronLeft className="size-4" aria-hidden="true" />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="rounded-full"
						onClick={onNextMonth}
						disabled={!canGoForward}
						aria-label="Next month"
					>
						<ChevronRight className="size-4" aria-hidden="true" />
					</Button>
				</div>
			</div>

			<div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
				<table className="w-full border-separate border-spacing-2" aria-label="Mood calendar">
					<thead>
						<tr>
							{WEEKDAY_LABELS.map((label) => (
								<th
									key={label}
									scope="col"
									className="pb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
								>
									{label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{weeks.map((week) => (
							<tr key={week[0]?.key ?? `week-${calendarMonth.yearMonth}`}>
								{week.map((cell) => {
									if (!cell.day) {
										return <td key={cell.key} className="p-0" />;
									}

									const day = cell.day;
									const mood = day.checkIn ? getMoodMeta(day.checkIn.mood) : null;
									const isSelected = selectedDay?.localDate === day.localDate;
									const label = `${formatDateLabel(day.localDate)}: ${mood?.label ?? "No check-in"}`;

									return (
										<td key={cell.key} className="p-0 align-top">
											<button
												type="button"
												className={cn(
													"flex aspect-square w-full min-w-[3.5rem] flex-col items-center justify-center rounded-2xl border text-center transition-colors",
													day.checkIn
														? "border-border bg-card hover:bg-accent/60"
														: "border-border/50 bg-background text-muted-foreground hover:bg-accent/30",
													isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
												)}
												onClick={() => setSelectedDate(day.checkIn ? day.localDate : null)}
												aria-label={label}
												aria-pressed={isSelected}
											>
												<span className="text-xs font-medium text-muted-foreground">
													{Number(day.localDate.slice(-2))}
												</span>
												<span className="mt-2 text-2xl" aria-hidden="true">
													{mood?.emoji ?? "·"}
												</span>
											</button>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{selectedDay?.checkIn ? (
				<div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
					<JournalEntry
						checkIn={selectedDay.checkIn}
						srOnlyHeading={`Check-in on ${formatDateLabel(selectedDay.localDate)}`}
					/>
				</div>
			) : null}
		</section>
	);
}
