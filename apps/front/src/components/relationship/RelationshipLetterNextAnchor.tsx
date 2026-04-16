/**
 * Section F — anticipation anchor (Story 7.3)
 */

import { Sparkles } from "lucide-react";
import { memo } from "react";

export const RelationshipLetterNextAnchor = memo(function RelationshipLetterNextAnchor() {
	return (
		<section
			data-testid="relationship-letter-next-anchor"
			aria-labelledby="relationship-letter-next-heading"
			className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-6 sm:p-8"
		>
			<div className="flex items-start gap-3">
				<Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
				<div>
					<h3 id="relationship-letter-next-heading" className="font-heading text-lg font-semibold">
						Your next letter
					</h3>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						Nerin is already learning more about both of you. When the time is right, a new letter can
						grow from what you share next — no rush, no meter, just more room to understand each other.
					</p>
				</div>
			</div>
		</section>
	);
});
