import { Link } from "@tanstack/react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { LIBRARY_TIER_LABELS, LIBRARY_TIERS, type LibraryTier } from "@/lib/library-content";

interface LibraryNavProps {
	activeTier?: LibraryTier;
	articleTitle?: string;
}

function libraryTierHash(tier: LibraryTier) {
	return `all-${tier}`;
}

export function LibraryNav({ activeTier, articleTitle }: LibraryNavProps) {
	return (
		<div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<nav
					aria-label="Library navigation"
					className="flex h-10 items-center gap-1 overflow-x-auto text-sm"
				>
					<Link
						to="/library"
						data-testid="library-nav-home"
						className="shrink-0 font-medium text-foreground transition-colors hover:text-foreground/80"
					>
						Library
					</Link>

					<span aria-hidden="true" className="mx-2 text-border">
						/
					</span>

					<div className="flex items-center gap-1">
						{LIBRARY_TIERS.map((tier) => {
							const isActive = activeTier === tier;

							return (
								<Link
									key={tier}
									to="/library"
									hash={libraryTierHash(tier)}
									data-testid={`library-nav-${tier}`}
									className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
										isActive
											? "bg-foreground/10 text-foreground"
											: "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
									}`}
								>
									{LIBRARY_TIER_LABELS[tier]}
								</Link>
							);
						})}
					</div>
				</nav>

				{articleTitle && activeTier ? (
					<Breadcrumb data-testid="library-breadcrumb" className="pb-2.5">
						<BreadcrumbList className="flex-nowrap gap-2 text-xs sm:gap-2">
							<BreadcrumbItem className="shrink-0">
								<BreadcrumbLink asChild>
									<Link to="/library">Library</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem className="shrink-0">
								<BreadcrumbLink asChild>
									<Link
										to="/library"
										hash={libraryTierHash(activeTier)}
										data-testid="library-breadcrumb-tier"
									>
										{LIBRARY_TIER_LABELS[activeTier]}
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem className="min-w-0">
								<BreadcrumbPage className="truncate">{articleTitle}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				) : null}
			</div>
		</div>
	);
}
