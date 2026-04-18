import type { CheckInPayload, WeekGridResponse } from "@workspace/contracts";
import { useState } from "react";
import { type CheckInDraft, CheckInForm } from "@/components/today/CheckInForm";
import { MoodDotsWeek } from "@/components/today/MoodDotsWeek";

/**
 * Static marketing preview using the real Today check-in components (not wired to /today APIs).
 */
export function TodayScreenMockup() {
	const [draft, setDraft] = useState<CheckInDraft>({ mood: null, note: "" });

	return (
		<div
			data-slot="today-screen-mockup"
			data-testid="today-screen-mockup"
			className="relative mx-auto flex w-full max-w-md flex-col gap-4"
		>
			<section
				aria-label="This week"
				className="rounded-[2rem] border border-border/50 bg-card/60 px-4 py-5 sm:px-6"
			>
				<MoodDotsWeek
					localDate={HOMEPAGE_TODAY_LOCAL_DATE}
					weekGrid={HOMEPAGE_WEEK_GRID}
					isLoading={false}
					isError={false}
				/>
			</section>
			<CheckInForm
				localDate={HOMEPAGE_TODAY_LOCAL_DATE}
				draft={draft}
				onDraftChange={setDraft}
				onSubmit={async (_payload: CheckInPayload) => undefined}
				isPending={false}
			/>
		</div>
	);
}

const HOMEPAGE_TODAY_LOCAL_DATE = "2026-04-16";

const HOMEPAGE_WEEK_GRID: WeekGridResponse = {
	weekId: "2026-W16",
	weeklyLetter: { status: "ready", generatedAt: "2026-04-19T08:00:00.000Z" },
	days: [
		{
			localDate: "2026-04-13",
			checkIn: {
				id: "homepage-check-in-mon",
				localDate: "2026-04-13",
				mood: "good",
				note: "A quieter start than I expected.",
				visibility: "private",
			},
		},
		{ localDate: "2026-04-14", checkIn: null },
		{
			localDate: "2026-04-15",
			checkIn: {
				id: "homepage-check-in-wed",
				localDate: "2026-04-15",
				mood: "uneasy",
				note: "Restless, but clearer after writing.",
				visibility: "private",
			},
		},
		{ localDate: HOMEPAGE_TODAY_LOCAL_DATE, checkIn: null },
		{
			localDate: "2026-04-17",
			checkIn: {
				id: "homepage-check-in-fri",
				localDate: "2026-04-17",
				mood: "okay",
				note: null,
				visibility: "private",
			},
		},
		{ localDate: "2026-04-18", checkIn: null },
		{ localDate: "2026-04-19", checkIn: null },
	],
};
