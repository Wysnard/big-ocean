import type { TraitName } from "@workspace/domain";
import { getTraitColor } from "@workspace/domain";

interface PersonalPortraitProps {
	personalDescription: string;
	dominantTrait: TraitName;
	/** When set, shows "{name}'s Portrait" instead of "Your Personal Portrait" */
	displayName?: string | null;
}

export function PersonalPortrait({
	personalDescription,
	dominantTrait,
	displayName,
}: PersonalPortraitProps) {
	const traitColor = getTraitColor(dominantTrait);

	return (
		<section data-slot="personal-portrait" className="px-6 py-12 md:py-16">
			<div className="mx-auto max-w-2xl">
				<h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
					{displayName ? `${displayName}\u2019s Portrait` : "Your Personal Portrait"}
				</h2>

				<div className="relative">
					{/* Accent bar */}
					<div
						className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
						style={{ backgroundColor: traitColor, opacity: 0.6 }}
					/>

					<blockquote className="pl-6 text-base md:text-lg leading-relaxed text-foreground/85">
						{personalDescription}
					</blockquote>
				</div>
			</div>
		</section>
	);
}
