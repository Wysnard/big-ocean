/**
 * Section C — letter history timeline (Story 7.3, MVP single entry)
 */

import { memo } from "react";

interface LetterHistoryEntry {
	readonly id: string;
	readonly label: string;
	readonly atIso: string;
}

interface RelationshipLetterHistoryProps {
	readonly entries: ReadonlyArray<LetterHistoryEntry>;
}

export const RelationshipLetterHistory = memo(function RelationshipLetterHistory({
	entries,
}: RelationshipLetterHistoryProps) {
	return (
		<section
			data-testid="relationship-letter-history"
			aria-labelledby="relationship-letter-history-heading"
			className="rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8"
		>
			<h3
				id="relationship-letter-history-heading"
				className="font-heading text-xl font-semibold text-foreground"
			>
				Letter history
			</h3>
			<p className="mt-2 text-sm text-muted-foreground">
				Each chapter you share with Nerin can become its own letter over time.
			</p>

			<ol className="relative mt-8 border-s border-border/50 ps-6">
				{entries.map((entry, i) => (
					<li key={entry.id} className="mb-10 ms-2 last:mb-0">
						<span
							className="absolute -start-1.5 mt-1.5 flex size-3 rounded-full border border-background bg-primary"
							aria-hidden
						/>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">
							{new Date(entry.atIso).toLocaleString(undefined, {
								dateStyle: "medium",
								timeStyle: "short",
							})}
						</p>
						<p className="mt-1 font-medium text-foreground">{entry.label}</p>
						{i === 0 && (
							<p className="mt-1 text-sm text-muted-foreground">
								This is the letter for this connection today. More years, more letters — later.
							</p>
						)}
					</li>
				))}
			</ol>
		</section>
	);
});
