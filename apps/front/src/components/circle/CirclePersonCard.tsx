import { Link } from "@tanstack/react-router";
import type { RelationshipAnalysisListItem } from "@workspace/contracts/http/groups/relationship";
import type { OceanCode5 } from "@workspace/domain";
import { GeometricSignature } from "@workspace/ui/components/geometric-signature";
import {
	formatLastSharedRelative,
	formatUnderstandingSinceMonthYear,
	lastSharedIsoForDisplay,
	UNKNOWN_PARTNER_OCEAN_CODE,
} from "./circle-relationship-copy";

interface CirclePersonCardProps {
	readonly item: RelationshipAnalysisListItem;
}

export function CirclePersonCard({ item }: CirclePersonCardProps) {
	const understandingSince = formatUnderstandingSinceMonthYear(item.createdAt);
	const lastSharedIso = lastSharedIsoForDisplay(item);
	const accessibilityLabel = `${item.partnerName}, ${item.partnerArchetypeName}, understanding each other since ${understandingSince}`;

	return (
		<article
			data-slot="circle-person-card"
			data-testid="circle-person-card"
			aria-label={accessibilityLabel}
			className="w-full rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8"
		>
			<div className="space-y-5">
				<div className="space-y-2">
					<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
						Your Circle
					</p>
					<h2 className="font-heading text-3xl font-semibold text-foreground">{item.partnerName}</h2>
				</div>

				<div className="flex items-center gap-3">
					{item.partnerOceanCode !== UNKNOWN_PARTNER_OCEAN_CODE ? (
						<GeometricSignature
							oceanCode5={item.partnerOceanCode as OceanCode5}
							size="card"
							className="shrink-0"
						/>
					) : null}
					<div className="space-y-1">
						<p className="text-lg font-medium text-foreground">{item.partnerArchetypeName}</p>
						<p className="text-sm tracking-[0.3em] text-muted-foreground">{item.partnerOceanCode}</p>
					</div>
				</div>

				<div className="space-y-2 text-sm leading-6 text-muted-foreground">
					<p>Understanding each other since {understandingSince}</p>
					{lastSharedIso ? (
						<p>Last shared: {formatLastSharedRelative(lastSharedIso)}</p>
					) : (
						<p>Letter still opening…</p>
					)}
				</div>

				<Link
					to="/relationship/$analysisId"
					params={{ analysisId: item.analysisId }}
					data-testid="circle-person-dynamic-link"
					className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
				>
					View your dynamic →
				</Link>
			</div>
		</article>
	);
}
