import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { PageMain } from "@/components/PageMain";
import { ThreeSpacePageContainer } from "@/components/ThreeSpacePageContainer";
import { MoodCalendarView } from "@/components/today/MoodCalendarView";
import { getCurrentYearMonth, shiftYearMonth, useCalendarMonth } from "@/hooks/use-calendar-month";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/today/calendar")({
	ssr: false,
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/login", search: { redirectTo: undefined } });
		}
	},
	component: MoodCalendarPage,
});

function MoodCalendarPage() {
	const currentYearMonth = getCurrentYearMonth();
	const [yearMonth, setYearMonth] = useState(currentYearMonth);
	const calendarMonthQuery = useCalendarMonth(yearMonth);

	return (
		<PageMain
			title="Mood Calendar"
			data-slot="mood-calendar-page"
			data-testid="mood-calendar-page"
			className="min-h-screen bg-background"
		>
			<ThreeSpacePageContainer className="max-w-4xl py-8">
				<div className="space-y-6">
					<Link
						to="/today"
						data-testid="mood-calendar-back-link"
						className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
					>
						<ArrowLeft className="size-4" aria-hidden="true" />
						Back to Today
					</Link>

					<MoodCalendarView
						calendarMonth={calendarMonthQuery.data}
						isLoading={calendarMonthQuery.isPending}
						isError={calendarMonthQuery.isError}
						canGoForward={yearMonth < currentYearMonth}
						onPreviousMonth={() => setYearMonth((current) => shiftYearMonth(current, -1))}
						onNextMonth={() => setYearMonth((current) => shiftYearMonth(current, 1))}
					/>
				</div>
			</ThreeSpacePageContainer>
		</PageMain>
	);
}
