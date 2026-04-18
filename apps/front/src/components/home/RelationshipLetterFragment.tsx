import { RelationshipLetterBody } from "@/components/relationship/RelationshipLetterBody";

/**
 * Static relationship letter fragment using the real relationship letter body.
 */
export function RelationshipLetterFragment() {
	return (
		<div
			data-slot="relationship-letter-fragment"
			data-testid="relationship-letter-fragment"
			className="rounded-2xl border border-border/50 bg-card/30 p-6 sm:p-8"
		>
			<RelationshipLetterBody
				userAName="Maya"
				userBName="Jordan"
				isLatestVersion
				content={`## The rhythm between you

You both reach for repair, but not on the same clock — one needs words while the stillness still stings, and the other needs the room to return without a verdict waiting.`}
			/>
		</div>
	);
}
