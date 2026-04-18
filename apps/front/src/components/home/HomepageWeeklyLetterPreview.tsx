import { WeeklyLetterCardPresentation } from "@/components/today/WeeklyLetterCardPresentation";

/**
 * Read-only Sunday weekly letter card using the same presentation as /today.
 */
export function HomepageWeeklyLetterPreview() {
	return (
		<div data-slot="homepage-weekly-letter-preview" data-testid="homepage-weekly-letter-preview">
			<WeeklyLetterCardPresentation />
		</div>
	);
}
