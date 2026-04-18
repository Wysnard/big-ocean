import { Layers3 } from "lucide-react";
import { LIBRARY_SCROLL_MT_CLASS } from "@/lib/library-layout";

export function FacetPolesSection({
	levels,
	lowCode,
	highCode,
}: {
	levels: Array<{ code: string; label: string; description: string }>;
	lowCode: string;
	highCode: string;
}) {
	return (
		<section
			id="facet-poles"
			className={`mb-10 ${LIBRARY_SCROLL_MT_CLASS} rounded-[1.5rem] border border-border/70 bg-muted/25 p-5 sm:p-6`}
		>
			<h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
				<Layers3 className="size-5 shrink-0 text-primary" aria-hidden />
				How this facet spans the scale
			</h2>
			<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
				Facet guides put the poles up front so readers who already know the parent trait can orient
				before the longer explanation.
			</p>
			<div className="mt-6 grid gap-4 md:grid-cols-2">
				{levels.map((level) => {
					const pole =
						level.code === lowCode ? "Lower pole" : level.code === highCode ? "Higher pole" : "Pole";
					return (
						<div key={level.code} className="rounded-[1.25rem] border border-border/70 bg-background p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								{pole}
							</p>
							<p className="mt-2 text-base font-semibold text-foreground">{level.label}</p>
							<p className="mt-0.5 text-xs font-mono text-muted-foreground/90">{level.code}</p>
							<p className="mt-2 text-sm leading-6 text-foreground/90">{level.description}</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}
