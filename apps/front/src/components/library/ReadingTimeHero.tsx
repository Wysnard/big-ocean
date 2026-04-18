import { Clock } from "lucide-react";

export function ReadingTimeHero({ minutes }: { minutes: number }) {
	const safeMinutes = Number.isFinite(minutes) ? Math.max(1, Math.round(minutes)) : 1;

	return (
		<p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
			<Clock className="size-4 shrink-0 text-primary" aria-hidden />
			<span>
				About <span className="font-medium text-foreground/90 tabular-nums">{safeMinutes}</span> min
				read
			</span>
		</p>
	);
}
