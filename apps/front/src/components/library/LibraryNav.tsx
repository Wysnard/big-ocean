import { Link } from "@tanstack/react-router";
import { LIBRARY_TIER_LABELS, LIBRARY_TIERS, type LibraryTier } from "@/lib/library-content";

interface LibraryNavProps {
	activeTier?: LibraryTier;
	articleTitle?: string;
}

export function LibraryNav({ activeTier, articleTitle }: LibraryNavProps) {
	return (
		<nav
			aria-label="Library navigation"
			className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-10 items-center gap-1 overflow-x-auto text-sm">
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
				</div>

				{articleTitle && activeTier ? (
					<div className="flex items-center gap-2 pb-2.5 text-xs text-muted-foreground">
						<Link to="/library" className="shrink-0 transition-colors hover:text-foreground">
							Library
						</Link>
						<span aria-hidden="true">/</span>
						<Link to="/library" className="shrink-0 transition-colors hover:text-foreground">
							{LIBRARY_TIER_LABELS[activeTier]}
						</Link>
						<span aria-hidden="true">/</span>
						<span className="truncate text-foreground">{articleTitle}</span>
					</div>
				) : null}
			</div>
		</nav>
	);
}
