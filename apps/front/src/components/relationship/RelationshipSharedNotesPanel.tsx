/**
 * Section D1 — shared notes (Story 7.3)
 */

import { useForm } from "@tanstack/react-form";
import type { RelationshipSharedNoteItem } from "@workspace/contracts/http/groups/relationship";
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
import { Loader2 } from "lucide-react";
import { memo } from "react";

const NOTE_BODY_MAX = 2000;

function formatNoteTimestamp(iso: string): string {
	const ms = Date.parse(iso);
	if (!Number.isFinite(ms)) return "Unknown time";
	return new Date(ms).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

interface RelationshipSharedNotesPanelProps {
	readonly notes: ReadonlyArray<RelationshipSharedNoteItem>;
	readonly isLoading: boolean;
	readonly notesError?: boolean;
	readonly onRetryNotes?: () => void;
	readonly onCreate: (body: string) => Promise<void>;
	readonly isCreating: boolean;
	readonly createErrorMessage?: string | null;
}

export const RelationshipSharedNotesPanel = memo(function RelationshipSharedNotesPanel({
	notes,
	isLoading,
	notesError = false,
	onRetryNotes,
	onCreate,
	isCreating,
	createErrorMessage = null,
}: RelationshipSharedNotesPanelProps) {
	const form = useForm({
		defaultValues: { body: "" },
		onSubmit: async ({ value }) => {
			const text = value.body.trim();
			if (!text) return;
			try {
				await onCreate(text);
				form.reset();
			} catch {
				// Error message comes from parent via createErrorMessage
			}
		},
	});

	return (
		<section
			data-testid="relationship-shared-notes"
			aria-labelledby="relationship-shared-notes-heading"
		>
			<Card className="border-border/60 bg-card/40">
				<CardHeader>
					<CardTitle id="relationship-shared-notes-heading" className="font-heading text-xl">
						Things you&apos;ve learned about each other
					</CardTitle>
					<CardDescription>
						Short notes only you two can see. No scores, no tracking — just words you choose to leave
						here.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{createErrorMessage ? (
						<p className="text-sm text-destructive" role="alert">
							{createErrorMessage}
						</p>
					) : null}
					<form
						className="space-y-4"
						noValidate
						onSubmit={(e) => {
							e.preventDefault();
							void form.handleSubmit();
						}}
					>
						<form.Field
							name="body"
							validators={{
								onSubmit: ({ value }) => {
									const t = value.trim();
									if (!t) return "Write something first";
									if (t.length > NOTE_BODY_MAX) {
										return `Keep it within ${NOTE_BODY_MAX} characters`;
									}
									return undefined;
								},
							}}
						>
							{(field) => (
								<Field>
									<FieldLabel htmlFor="relationship-shared-note-body">Add a note</FieldLabel>
									<Textarea
										id="relationship-shared-note-body"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="Something you noticed, appreciated, or want to remember together…"
										rows={3}
										maxLength={NOTE_BODY_MAX}
										className="min-h-24 resize-y"
										disabled={isCreating}
									/>
									<p className="text-xs text-muted-foreground">
										{field.state.value.length} / {NOTE_BODY_MAX}
									</p>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
									)}
								</Field>
							)}
						</form.Field>
						<Button type="submit" disabled={isCreating} className="min-h-11 gap-2">
							{isCreating ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Saving…
								</>
							) : (
								"Save note"
							)}
						</Button>
					</form>

					<div className="border-t border-border/40 pt-6">
						<h4 className="text-sm font-medium text-foreground">Earlier notes</h4>
						{notesError ? (
							<div className="mt-3 space-y-2">
								<p className="text-sm text-destructive" role="alert">
									Notes could not be loaded.
								</p>
								{onRetryNotes ? (
									<Button type="button" variant="outline" size="sm" onClick={() => onRetryNotes()}>
										Try again
									</Button>
								) : null}
							</div>
						) : isLoading ? (
							<p className="mt-3 text-sm text-muted-foreground">Loading…</p>
						) : notes.length === 0 ? (
							<p className="mt-3 text-sm text-muted-foreground">No notes yet — yours can be first.</p>
						) : (
							<ul className="mt-4 space-y-4">
								{notes.map((n) => (
									<li
										key={n.id}
										className="rounded-xl border border-border/40 bg-background/60 p-4"
										data-testid={`relationship-shared-note-${n.id}`}
									>
										<p className="text-xs text-muted-foreground">
											{n.authorDisplayName} · {formatNoteTimestamp(n.createdAt)}
										</p>
										<p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{n.body}</p>
									</li>
								))}
							</ul>
						)}
					</div>
				</CardContent>
			</Card>
		</section>
	);
});
