import { WEEKLY_LETTER_HEADLINE } from "@workspace/contracts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

export interface WeeklyLetterCardPresentationProps {
	readonly className?: string;
}

/**
 * Static Sunday weekly letter promo surface (no routing, no week grid).
 * Used by {@link WeeklyLetterCard} inside the `/today` link wrapper.
 */
export function WeeklyLetterCardPresentation({ className }: WeeklyLetterCardPresentationProps) {
	return (
		<Card
			className={cn(
				"border-primary/35 bg-primary/5 shadow-sm transition-colors hover:bg-primary/10",
				className,
			)}
		>
			<CardHeader className="space-y-1 border-0 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
				<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
					This week
				</p>
				<CardTitle className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
					{WEEKLY_LETTER_HEADLINE}
				</CardTitle>
				<CardDescription className="text-sm leading-6">
					Tap to read Nerin&apos;s letter.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
				<span className="text-sm font-medium text-primary">Open letter →</span>
			</CardContent>
		</Card>
	);
}
