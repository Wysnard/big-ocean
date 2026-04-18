import { getTraitLevelLabel, type TraitName } from "@workspace/domain";
import { Compass } from "lucide-react";
import { LIBRARY_SCROLL_MT_CLASS } from "@/lib/library-layout";

export function TraitSpectrumSection({
	trait,
	tagline,
	spectrum,
}: {
	trait: TraitName;
	tagline: string;
	spectrum: Array<{ level: string; description: string }>;
}) {
	return (
		<section
			id="across-the-spectrum"
			className={`mb-10 ${LIBRARY_SCROLL_MT_CLASS} rounded-[1.5rem] border border-border/70 bg-muted/20 p-5 sm:p-6`}
		>
			<h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
				<Compass className="size-5 shrink-0 text-primary" aria-hidden />
				Across the spectrum
			</h2>
			<p className="mt-3 text-sm leading-6 text-muted-foreground">{tagline}</p>
			<div className="mt-4 space-y-3">
				{spectrum.map((row) => {
					const levelName = getTraitLevelLabel(trait, row.level);
					return (
						<div key={row.level} className="rounded-[1.25rem] border border-border/70 bg-background p-4">
							<p className="text-sm font-semibold leading-snug text-foreground">
								{levelName}
								<span className="ml-2 font-normal tabular-nums text-muted-foreground">({row.level})</span>
							</p>
							<p className="mt-2 text-sm leading-6 text-foreground/90">{row.description}</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}
