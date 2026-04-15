import { Button } from "@workspace/ui/components/button";
import { InviteCeremonyCard } from "@/components/invite/InviteCeremonyCard";
import { useRelationshipAnalysesList } from "@/hooks/useRelationshipAnalysesList";
import { CirclePersonCard } from "./CirclePersonCard";
import { CIRCLE_PAGE_EMPTY_STATE } from "./circle-empty-messages";

export function CirclePageContent() {
	const { data: analyses, isLoading, isError, refetch } = useRelationshipAnalysesList(true);
	const orderedAnalyses = [...(analyses ?? [])].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
	);

	return (
		<div className="space-y-6">
			<section
				aria-label="Circle introduction"
				className="w-full rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8"
			>
				<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
					Space Three
				</p>
				<h1 className="mt-3 font-heading text-3xl font-bold text-foreground">
					The people you return to live here.
				</h1>
				<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
					Your Circle holds the relationship readings that stay close, without turning intimacy into a
					scoreboard.
				</p>
			</section>

			<section aria-label="Circle relationships" className="space-y-4">
				{isLoading ? (
					Array.from({ length: 2 }).map((_, index) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: static loading placeholders
							key={index}
							data-testid="circle-person-card-skeleton"
							className="w-full animate-pulse rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8"
						>
							<div className="space-y-4">
								<div className="h-4 w-28 rounded-full bg-muted" />
								<div className="h-8 w-40 rounded-full bg-muted" />
								<div className="h-5 w-48 rounded-full bg-muted" />
								<div className="h-4 w-64 rounded-full bg-muted" />
							</div>
						</div>
					))
				) : isError ? (
					<div className="rounded-[2rem] border border-border bg-card p-6 text-sm leading-6 text-muted-foreground shadow-sm sm:p-8">
						<p>Your Circle is taking a moment to load.</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								void refetch();
							}}
							className="mt-4 rounded-full"
						>
							Try again
						</Button>
					</div>
				) : orderedAnalyses.length === 0 ? (
					<div className="rounded-[2rem] border border-border bg-card p-6 text-base leading-7 text-muted-foreground shadow-sm sm:p-8">
						<p>{CIRCLE_PAGE_EMPTY_STATE}</p>
					</div>
				) : (
					orderedAnalyses.map((analysis) => (
						<CirclePersonCard key={analysis.analysisId} item={analysis} />
					))
				)}
			</section>

			<section aria-label="Invite someone into your Circle" className="w-full">
				<InviteCeremonyCard placement="circle-bottom" />
			</section>
		</div>
	);
}
