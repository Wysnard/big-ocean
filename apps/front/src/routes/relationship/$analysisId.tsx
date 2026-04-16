/**
 * Relationship letter living page (Story 7.3, prior Story 14.4 / 35-3)
 *
 * Polls while content is null; ritual gate on first visit; sections A–F.
 */

import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { PageMain } from "@/components/PageMain";
import { RelationshipLetterBody } from "@/components/relationship/RelationshipLetterBody";
import { RelationshipLetterHistory } from "@/components/relationship/RelationshipLetterHistory";
import { RelationshipLetterNextAnchor } from "@/components/relationship/RelationshipLetterNextAnchor";
import { RelationshipLetterTraitGrid } from "@/components/relationship/RelationshipLetterTraitGrid";
import { RelationshipSharedNotesPanel } from "@/components/relationship/RelationshipSharedNotesPanel";
import {
	useRelationshipAnalysis,
	useRetryRelationshipAnalysis,
} from "@/hooks/useRelationshipAnalysis";
import {
	useCreateRelationshipSharedNote,
	useRelationshipSharedNotes,
} from "@/hooks/useRelationshipSharedNotes";
import { getSession } from "@/lib/auth-client";
import { hasSeenRelationshipLetterRitual } from "@/lib/relationship-letter-ritual-storage";

export const Route = createFileRoute("/relationship/$analysisId")({
	ssr: false,
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({
				to: "/login",
				search: { sessionId: undefined, redirectTo: undefined },
			});
		}
	},
	component: RelationshipLetterPage,
});

function RelationshipLetterPage() {
	const { analysisId } = Route.useParams();
	const navigate = useNavigate();

	const { data, isLoading, error, isFetching } = useRelationshipAnalysis(analysisId);
	const retryMutation = useRetryRelationshipAnalysis(analysisId);
	const notesQuery = useRelationshipSharedNotes(analysisId, Boolean(data?.content));
	const createNoteMutation = useCreateRelationshipSharedNote(analysisId);

	const pollCountRef = useRef(0);
	useEffect(() => {
		if (!isLoading && data?.content === null && !isFetching) {
			pollCountRef.current += 1;
		}
	}, [isLoading, data?.content, isFetching]);

	useEffect(() => {
		if (isLoading || data?.content === null || data?.content === undefined) return;
		if (!hasSeenRelationshipLetterRitual(analysisId)) {
			void navigate({
				to: "/relationship/$analysisId/ritual",
				params: { analysisId },
				replace: true,
			});
		}
	}, [isLoading, data?.content, analysisId, navigate]);

	const historyEntries = useMemo(() => {
		if (!data?.content) return [];
		const at = data.contentCompletedAt ?? data.createdAt;
		return [{ id: "mvp-single", label: "This connection", atIso: at }];
	}, [data?.content, data?.contentCompletedAt, data?.createdAt]);

	if (isLoading) {
		return (
			<PageMain
				data-testid="relationship-analysis-page"
				data-testid-state="loading"
				title="Loading relationship letter"
				className="min-h-screen bg-background"
			>
				<output
					className="mx-auto block max-w-2xl space-y-6 px-5 py-8"
					aria-label="Loading relationship letter"
				>
					<div className="h-8 w-32 animate-pulse rounded bg-muted" />
					<div className="space-y-4 rounded-xl border border-border bg-card p-6">
						<div className="h-6 w-48 animate-pulse rounded bg-muted" />
						<div className="h-4 w-full animate-pulse rounded bg-muted" />
						<div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
						<div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
					</div>
				</output>
			</PageMain>
		);
	}

	if (error || !data) {
		const isUnauthorized =
			(error as unknown as Record<string, unknown> | null)?._tag ===
			"RelationshipAnalysisUnauthorizedError";
		return (
			<PageMain
				data-testid="relationship-analysis-page"
				data-testid-state="error"
				className="flex min-h-screen items-center justify-center bg-background px-6"
				role="alert"
			>
				<div className="space-y-4 text-center">
					<h1 className="text-xl font-bold text-foreground">Letter not found</h1>
					<p className="text-sm text-muted-foreground">
						{isUnauthorized
							? "You are not authorized to open this letter."
							: "This letter could not be found."}
					</p>
					<Button asChild variant="outline" className="min-h-11">
						<Link to="/">Go home</Link>
					</Button>
				</div>
			</PageMain>
		);
	}

	if (data.content !== null && !hasSeenRelationshipLetterRitual(analysisId)) {
		return (
			<PageMain
				data-testid="relationship-analysis-page"
				data-testid-state="opening-ritual"
				title="Relationship letter"
				className="min-h-screen bg-background"
			>
				<output
					className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-5"
					aria-live="polite"
					aria-busy="true"
				>
					<Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
					<p className="text-center text-sm text-muted-foreground">Opening reading together…</p>
				</output>
			</PageMain>
		);
	}

	if (data.content === null) {
		const hasPolledEnough = pollCountRef.current > 3;
		return (
			<PageMain
				data-testid="relationship-analysis-page"
				data-testid-state="generating"
				title="Generating relationship letter"
				className="min-h-screen bg-background"
			>
				<div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
					<div className="space-y-4 rounded-xl border border-border bg-card p-6">
						<div className="flex items-center gap-3">
							<div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
							<div className="h-5 w-40 animate-pulse rounded bg-muted" />
						</div>
						<div className="h-4 w-full animate-pulse rounded bg-muted" />
						<div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
					</div>
					<output className="block space-y-2 text-center">
						<p className="text-sm font-medium text-foreground">
							{hasPolledEnough
								? "Generation may have stalled."
								: "Your relationship letter is being written…"}
						</p>
						<p className="text-xs text-muted-foreground">
							{hasPolledEnough ? "Try again when you are ready." : "This can take a minute."}
						</p>
					</output>
					<div className="flex justify-center">
						<Button
							data-testid="relationship-retry-button"
							variant="outline"
							size="sm"
							className="min-h-11 gap-2"
							onClick={() => retryMutation.mutate()}
							disabled={retryMutation.isPending}
							aria-label="Retry relationship letter generation"
						>
							Try again
						</Button>
					</div>
				</div>
			</PageMain>
		);
	}

	const ritualSeen = hasSeenRelationshipLetterRitual(analysisId);

	const createNoteErrorMessage = createNoteMutation.isError
		? createNoteMutation.error instanceof Error && createNoteMutation.error.message.trim()
			? createNoteMutation.error.message
			: "Could not save your note. Try again."
		: null;

	return (
		<PageMain
			data-testid="relationship-analysis-page"
			data-testid-state="ready"
			title={`Relationship letter: ${data.userAName} and ${data.userBName}`}
			className="min-h-screen bg-background"
		>
			<div className="mx-auto max-w-[65ch] px-5 py-8">
				<div className="mb-8 flex flex-wrap items-center gap-3">
					<Button variant="ghost" size="sm" className="-ml-2 min-h-11 text-muted-foreground" asChild>
						<Link to="/">
							<ArrowLeft className="mr-1.5 size-4" />
							Back
						</Link>
					</Button>
					{ritualSeen && (
						<Button asChild variant="outline" size="sm" className="min-h-11 gap-2">
							<Link to="/relationship/$analysisId/ritual" params={{ analysisId }}>
								<BookOpen className="size-4" aria-hidden />
								Read together again
							</Link>
						</Button>
					)}
				</div>

				<main className="space-y-16">
					<section aria-labelledby="relationship-letter-a-title" className="scroll-mt-8">
						<h2 id="relationship-letter-a-title" className="sr-only">
							This year&apos;s letter
						</h2>
						<article className="rounded-2xl border border-border/50 bg-card/30 p-6 sm:p-10">
							<RelationshipLetterBody
								content={data.content}
								userAName={data.userAName}
								userBName={data.userBName}
								isLatestVersion={data.isLatestVersion}
							/>
						</article>
					</section>

					<RelationshipLetterTraitGrid
						userAName={data.userAName}
						userBName={data.userBName}
						userATraits={data.userATraits}
						userBTraits={data.userBTraits}
					/>

					<RelationshipLetterHistory entries={historyEntries} />

					<RelationshipSharedNotesPanel
						notes={notesQuery.data ?? []}
						isLoading={notesQuery.isLoading}
						notesError={notesQuery.isError}
						onRetryNotes={() => {
							void notesQuery.refetch();
						}}
						onCreate={async (body) => {
							await createNoteMutation.mutateAsync(body);
						}}
						isCreating={createNoteMutation.isPending}
						createErrorMessage={createNoteErrorMessage}
					/>

					<RelationshipLetterNextAnchor />
				</main>
			</div>
		</PageMain>
	);
}
