import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export function RelatedArchetypePatternsColumn({
	compatibleArchetypes,
	roleByRelatedSlug,
}: {
	compatibleArchetypes: Array<{ title: string; description: string; pathname: string }>;
	roleByRelatedSlug: Record<string, string>;
}) {
	if (compatibleArchetypes.length === 0) {
		return null;
	}

	return (
		<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
			<h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
				<Compass className="size-5 shrink-0 text-primary" aria-hidden />
				Who this pattern pairs with
			</h2>
			<p className="mt-2 text-sm leading-6 text-muted-foreground">
				Relational fit, not a directory — a few archetypes that often show up alongside this pattern.
			</p>
			<div className="mt-4 grid gap-3">
				{compatibleArchetypes.map((a) => {
					const slug = a.pathname.split("/").filter(Boolean).pop() ?? "";
					const role = roleByRelatedSlug[slug] ?? "Also explore";

					return (
						<Link
							key={a.pathname}
							to={a.pathname}
							data-testid={`compatible-archetype-${slug}`}
							className="block cursor-pointer rounded-[1.25rem] border border-border/70 bg-background p-4 transition-colors duration-200 hover:border-primary/35 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{role}</p>
							<h3 className="mt-2 text-base font-semibold text-foreground">{a.title}</h3>
							<p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">{a.description}</p>
						</Link>
					);
				})}
			</div>
		</section>
	);
}
