import { ClientOnly, Link } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight } from "lucide-react";
import { useGetResults, useListConversations } from "@/hooks/use-conversation";
import { useSession } from "@/lib/auth-client";
import type { LibraryEntryData } from "@/lib/library-content";
import {
	buildStaticRecommendedFallback,
	resolveRecommendedPathFromResults,
} from "@/lib/library-recommended-path";

function getLatestCompletedSessionId(
	sessions: ReadonlyArray<{ id: string; status: string }>,
): string | null {
	return sessions.find((session) => session.status === "completed")?.id ?? null;
}

function ArticlePathCards({
	entries,
}: {
	entries: readonly [LibraryEntryData, LibraryEntryData, LibraryEntryData];
}) {
	return (
		<div className="grid gap-4 lg:grid-cols-3">
			{entries.map((entry, index) => (
				<Link
					key={entry.pathname}
					to={entry.pathname}
					className="group rounded-2xl border border-border/70 bg-muted/20 p-5 transition-colors hover:border-foreground/25"
				>
					<div className="flex items-center justify-between gap-3">
						<span className="font-data text-sm text-primary">0{index + 1}</span>
						<ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
					</div>
					<h3 className="mt-5 font-heading text-xl font-semibold text-foreground">{entry.title}</h3>
					<p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.description}</p>
				</Link>
			))}
		</div>
	);
}

function RecommendedPathSection({
	entries,
}: {
	entries: readonly [LibraryEntryData, LibraryEntryData, LibraryEntryData];
}) {
	const start = entries[0];
	if (!start) {
		return null;
	}

	return (
		<section
			data-auth-state="authenticated-assessed"
			className="rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.06] via-background to-primary/[0.03] p-6 shadow-sm sm:p-8"
		>
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Assessment complete</Badge>
						<Badge variant="outline">Signed-in state</Badge>
					</div>
					<h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">
						Read your results from pattern to precision.
					</h2>
					<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
						After someone has their portrait, the library can stop being generic. Start with the archetype
						pattern, then move into the trait and facet language that helps the result feel usable.
					</p>
				</div>
				<Button variant="secondary" asChild>
					<Link to={start.pathname}>
						Start recommended path
						<ArrowRight data-icon="inline-end" />
					</Link>
				</Button>
			</div>
			<div className="mt-6">
				<ArticlePathCards entries={entries} />
			</div>
		</section>
	);
}

function RecommendedPathInner() {
	const { data: session, isPending: sessionPending } = useSession();
	const listEnabled = Boolean(session?.user);
	const { data: listData, isPending: listPending } = useListConversations(listEnabled);
	const completedId =
		listEnabled && listData?.sessions ? getLatestCompletedSessionId(listData.sessions) : null;

	const {
		data: results,
		isPending: resultsPending,
		isError,
	} = useGetResults(completedId ?? "", Boolean(completedId));

	if (sessionPending || !session?.user) {
		return null;
	}
	if (listPending) {
		return null;
	}
	if (!completedId) {
		return null;
	}
	if (resultsPending) {
		return null;
	}

	const fallback = buildStaticRecommendedFallback();
	const entries =
		results && !isError ? resolveRecommendedPathFromResults(results, fallback) : fallback;

	return <RecommendedPathSection entries={entries} />;
}

export function LibraryRecommendedPathBand() {
	return (
		<ClientOnly fallback={null}>
			<RecommendedPathInner />
		</ClientOnly>
	);
}
