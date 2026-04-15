import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { InviteCeremonyCard } from "@/components/invite/InviteCeremonyCard";
import { useRelationshipAnalysesList } from "@/hooks/useRelationshipAnalysesList";

const EMPTY_STATE_COPY = "Big Ocean is made for the few people you care about";

function formatRelationshipCount(count: number) {
	return `${count} ${count === 1 ? "connection" : "connections"}`;
}

export function YourCirclePreviewSection() {
	const { data: analyses, isLoading, isError, refetch } = useRelationshipAnalysesList(true);
	const previewItems = analyses?.slice(0, 3) ?? [];
	const remainingCount = Math.max((analyses?.length ?? 0) - previewItems.length, 0);
	const showCount = !isLoading && analyses !== undefined && analyses.length > 0;

	return (
		<div data-testid="me-circle-preview" className="space-y-5">
			<div className="flex items-center justify-between gap-4">
				<div className="space-y-1">
					{showCount ? (
						<p className="text-sm font-medium text-foreground">
							{formatRelationshipCount(analyses.length)}
						</p>
					) : null}
					{isLoading ? (
						<div
							data-testid="me-circle-loading"
							className="h-4 w-32 animate-pulse rounded-full bg-muted"
						/>
					) : isError ? (
						<p className="text-sm leading-6 text-muted-foreground">
							Your Circle is taking a moment to load.
						</p>
					) : analyses && analyses.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{previewItems.map((analysis) => (
								<span
									key={analysis.analysisId}
									className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground"
								>
									{analysis.partnerArchetypeName}
								</span>
							))}
							{remainingCount > 0 ? (
								<span className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground">
									+{remainingCount}
								</span>
							) : null}
						</div>
					) : (
						<p className="text-sm leading-6 text-muted-foreground">{EMPTY_STATE_COPY}</p>
					)}
				</div>

				<Link
					to="/circle"
					data-testid="me-circle-view-all-link"
					className="text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
				>
					View all →
				</Link>
			</div>

			{isError ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						void refetch();
					}}
					className="rounded-full"
				>
					Try again
				</Button>
			) : null}

			<div data-testid="me-circle-invite" className="pt-2">
				<InviteCeremonyCard placement="me-section" />
			</div>
		</div>
	);
}
