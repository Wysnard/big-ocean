/**
 * Canonical user-state slice for portrait spine extraction (ADR-51 / ADR-55).
 * Sourced from persisted UserSummary rows — never raw conversation in the portrait pipeline.
 */
export interface PortraitUserSummaryInput {
	readonly summaryText: string;
	readonly themes: readonly { readonly theme: string; readonly description: string }[];
	readonly quoteBank: readonly { readonly quote: string }[];
}
