import { useForm } from "@tanstack/react-form";
import type { CheckInPayload, CheckInResponse, WeekGridResponse } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { Loader2 } from "lucide-react";
import { JournalEntry } from "./JournalEntry";
import { MoodDotsWeek } from "./MoodDotsWeek";
import { QuietAnticipationLine } from "./QuietAnticipationLine";
import { moodOptions } from "./today-mood-meta";

export type CheckInDraft = {
	mood: CheckInPayload["mood"] | null;
	note: string;
};

const checkInCardClassName = "w-full rounded-[2rem] border-border/70 bg-card/95 shadow-sm";

const normalizeNote = (value: string) => {
	const note = value.trim();
	return note.length > 0 ? note : null;
};

interface CheckInFormProps {
	localDate: string;
	draft: CheckInDraft;
	onDraftChange: (draft: CheckInDraft) => void;
	onSubmit: (payload: CheckInPayload) => Promise<void>;
	isPending?: boolean;
}

export function CheckInForm({
	localDate,
	draft,
	onDraftChange,
	onSubmit,
	isPending = false,
}: CheckInFormProps) {
	const form = useForm({
		defaultValues: draft,
		onSubmit: async ({ value }) => {
			if (!value.mood) {
				return;
			}

			try {
				await onSubmit({
					localDate,
					mood: value.mood,
					note: normalizeNote(value.note),
					visibility: "private",
				});
			} catch {
				// The route-level hook handles user feedback; keeping the draft intact is the priority here.
			}
		},
	});

	return (
		<Card className={cn(checkInCardClassName, "gap-0 py-0")} data-slot="today-check-in-form">
			<CardHeader className="space-y-2 border-0 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
				<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Today</p>
				<CardTitle className="font-heading text-3xl font-bold tracking-tight text-foreground">
					How are you feeling this morning?
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6 px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
				<form
					noValidate
					className="space-y-6"
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<form.Field name="mood">
						{(field) => (
							<Field>
								<FieldLabel asChild>
									<div className="text-sm font-medium text-foreground">Choose a mood</div>
								</FieldLabel>
								<div className="grid grid-cols-5 gap-2 sm:gap-3">
									{moodOptions.map((option) => {
										const isSelected = field.state.value === option.value;

										return (
											<Button
												key={option.value}
												type="button"
												variant="outline"
												aria-label={`Feeling ${option.value}`}
												aria-pressed={isSelected}
												data-selected={isSelected}
												className={cn(
													"h-auto min-h-[44px] min-w-0 w-full flex-col gap-1 rounded-2xl px-2 py-3 text-center font-normal shadow-none whitespace-normal transition-colors",
													isSelected
														? "border-primary bg-primary/8 text-foreground hover:border-primary hover:bg-primary/12 dark:border-primary dark:bg-primary/8 dark:hover:border-primary dark:hover:bg-primary/12"
														: "border-border/70 bg-background/70 hover:border-foreground/20 hover:bg-accent/50 dark:border-input dark:bg-input/30 dark:hover:bg-accent/50",
												)}
												onClick={() => {
													field.handleChange(option.value);
													onDraftChange({
														mood: option.value,
														note: form.state.values.note,
													});
												}}
											>
												<span aria-hidden="true" className="text-2xl leading-none">
													{option.emoji}
												</span>
												<span className="text-[0.7rem] font-medium text-muted-foreground">{option.label}</span>
											</Button>
										);
									})}
								</div>
							</Field>
						)}
					</form.Field>

					<form.Field name="note">
						{(field) => (
							<Field>
								<FieldLabel htmlFor="today-check-in-note">One note, if you want</FieldLabel>
								<Textarea
									id="today-check-in-note"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => {
										field.handleChange(event.target.value);
										onDraftChange({
											mood: form.state.values.mood,
											note: event.target.value,
										});
									}}
									placeholder="One note, if you want"
									className="min-h-28 rounded-2xl border-border/70 bg-background/70 px-4 py-3 shadow-none"
								/>
							</Field>
						)}
					</form.Field>

					<form.Subscribe>
						{(state) => {
							const selectedMood = state.values.mood;
							const isSubmitting = state.isSubmitting;
							return (
								<Button
									type="submit"
									size="lg"
									className="w-full rounded-2xl font-heading text-base font-semibold"
									disabled={!selectedMood || isSubmitting || isPending}
								>
									{(isSubmitting || isPending) && <Loader2 className="h-4 w-4 motion-safe:animate-spin" />}
									Save
								</Button>
							);
						}}
					</form.Subscribe>
				</form>
			</CardContent>
		</Card>
	);
}

export function CheckInFormSkeleton() {
	return (
		<Card
			className={cn(checkInCardClassName, "gap-0 py-0")}
			aria-busy="true"
			data-slot="today-check-in-skeleton"
		>
			<CardContent className="animate-pulse space-y-6 px-6 py-6 sm:px-8 sm:py-8">
				<div className="space-y-3">
					<div className="h-4 w-16 rounded-full bg-muted" />
					<div className="h-10 w-72 max-w-full rounded-full bg-muted" />
				</div>
				<div className="grid grid-cols-5 gap-2 sm:gap-3">
					{moodOptions.map((option) => (
						<div key={option.value} className="min-h-14 rounded-2xl bg-muted" />
					))}
				</div>
				<div className="space-y-3">
					<div className="h-4 w-36 rounded-full bg-muted" />
					<div className="min-h-28 rounded-2xl bg-muted" />
				</div>
				<div className="min-h-12 rounded-2xl bg-muted" />
			</CardContent>
		</Card>
	);
}

export function CheckInSavedState({
	checkIn,
	isSaving = false,
	localDate,
	weekGrid,
	weekQueryPending,
	weekQueryError,
}: {
	checkIn: CheckInResponse;
	isSaving?: boolean;
	localDate: string;
	weekGrid: WeekGridResponse | undefined;
	weekQueryPending: boolean;
	weekQueryError: boolean;
}) {
	return (
		<Card className={cn(checkInCardClassName, "gap-0 py-0")} data-slot="today-check-in-saved">
			<CardHeader className="border-0 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
				<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Today</p>
				<CardTitle className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
					Your check-in
				</CardTitle>
				<CardDescription className="text-sm leading-6">
					{isSaving ? "Saving your check-in…" : "Recorded quietly for your week."}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-8 px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
				<JournalEntry checkIn={checkIn} />
				<div className="border-t border-border/40 pt-6">
					<MoodDotsWeek
						localDate={localDate}
						weekGrid={weekGrid}
						isLoading={weekQueryPending}
						isError={weekQueryError}
					/>
				</div>
				<QuietAnticipationLine />
			</CardContent>
		</Card>
	);
}
