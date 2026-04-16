import type { CheckInPayload } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { useState } from "react";
import {
	type CheckInDraft,
	CheckInForm,
	CheckInFormSkeleton,
	CheckInSavedState,
} from "@/components/today/CheckInForm";
import { MoodDotsWeek } from "@/components/today/MoodDotsWeek";
import { hasCheckInRecord, useTodayCheckIn } from "@/hooks/use-today-check-in";

const emptyDraft: CheckInDraft = {
	mood: null,
	note: "",
};

export function TodayCheckInSurface() {
	const [draft, setDraft] = useState<CheckInDraft>(emptyDraft);
	const { localDate, todayQuery, weekQuery, submitCheckIn } = useTodayCheckIn();

	const checkIn = hasCheckInRecord(todayQuery.data) ? todayQuery.data : null;
	// Keep skeleton until today's check-in state is known; week grid must not hide it early.
	const isInitialLoading = todayQuery.isPending;
	const hasBlockingError = todayQuery.isError && !todayQuery.data;

	const weekGridBlocking = weekQuery.isError && !weekQuery.data;

	const handleSubmit = async (payload: CheckInPayload) => {
		await submitCheckIn.mutateAsync(payload);
		setDraft(emptyDraft);
	};

	if (isInitialLoading) {
		return (
			<section aria-label="Loading check-in" data-testid="today-check-in-loading-section">
				<CheckInFormSkeleton />
			</section>
		);
	}

	if (hasBlockingError) {
		return (
			<section aria-label="Check-in could not load">
				<Card
					className="w-full rounded-[2rem] border-destructive/30 bg-card py-0 shadow-sm"
					role="alert"
				>
					<CardHeader className="border-0 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
						<CardTitle className="font-heading text-2xl font-bold text-foreground">
							Today needs one more try.
						</CardTitle>
						<CardDescription className="leading-6">
							We couldn&apos;t load your check-in just now.
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
						<Button
							variant="outline"
							className="rounded-2xl"
							onClick={() => {
								void todayQuery.refetch();
								void weekQuery.refetch();
							}}
						>
							Retry
						</Button>
					</CardContent>
				</Card>
			</section>
		);
	}

	const surfaceState = checkIn ? "post" : "pre";

	return (
		<div
			key={surfaceState}
			data-slot="today-check-in-surface"
			data-testid="today-check-in-surface"
			data-state={surfaceState}
			className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-400 motion-reduce:animate-none motion-reduce:opacity-100"
		>
			{checkIn ? (
				<section aria-label="Today's check-in">
					<CheckInSavedState
						checkIn={checkIn}
						isSaving={submitCheckIn.isPending}
						localDate={localDate}
						weekGrid={weekQuery.data}
						weekQueryPending={weekQuery.isPending}
						weekQueryError={weekGridBlocking}
					/>
				</section>
			) : (
				<div className="flex w-full flex-col gap-6">
					<section
						aria-label="This week"
						className="rounded-[2rem] border border-border/50 bg-card/60 px-4 py-5 sm:px-6"
					>
						<MoodDotsWeek
							localDate={localDate}
							weekGrid={weekQuery.data}
							isLoading={weekQuery.isPending}
							isError={weekGridBlocking}
						/>
					</section>
					<section aria-label="Daily check-in">
						<CheckInForm
							localDate={localDate}
							draft={draft}
							onDraftChange={setDraft}
							onSubmit={handleSubmit}
							isPending={submitCheckIn.isPending}
						/>
					</section>
				</div>
			)}
		</div>
	);
}
