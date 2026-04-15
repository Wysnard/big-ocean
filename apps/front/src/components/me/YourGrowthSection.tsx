import { Link } from "@tanstack/react-router";
import { useHasCheckIns } from "@/hooks/use-has-check-ins";
import { MePageSection } from "./MePageSection";

export function YourGrowthSection() {
	const { data, isLoading, isError } = useHasCheckIns();

	if (isLoading || isError || !data?.hasCheckIns) {
		return null;
	}

	return (
		<MePageSection title="Your Growth" data-slot="me-section-growth" data-testid="me-section-growth">
			<div className="space-y-4">
				<p className="text-base leading-7 text-muted-foreground">
					Look back across your check-ins to notice the quiet shape of the month.
				</p>
				<Link
					to="/today/calendar"
					data-testid="me-growth-calendar-link"
					className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
				>
					Open mood calendar
				</Link>
			</div>
		</MePageSection>
	);
}
