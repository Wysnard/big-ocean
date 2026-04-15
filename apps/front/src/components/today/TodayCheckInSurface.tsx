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

	const handleSubmit = async (payload: CheckInPayload) => {
		await submitCheckIn.mutateAsync(payload);
		setDraft(emptyDraft);
	};

	if (isInitialLoading) {
		return <CheckInFormSkeleton />;
	}

	if (hasBlockingError) {
		return (
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
		);
	}

	const surfaceState = checkIn ? "post" : "pre";

	return (
		<div
			key={surfaceState}
			data-slot="today-check-in-surface"
			data-testid="today-check-in-surface"
			data-state={surfaceState}
			className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-400"
		>
			{checkIn ? (
				<CheckInSavedState checkIn={checkIn} isSaving={submitCheckIn.isPending} />
			) : (
				<CheckInForm
					localDate={localDate}
					draft={draft}
					onDraftChange={setDraft}
					onSubmit={handleSubmit}
					isPending={submitCheckIn.isPending}
				/>
			)}
		</div>
	);
}
