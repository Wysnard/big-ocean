import type { OceanCode5 } from "@workspace/domain";
import { GeometricSignature } from "@workspace/ui/components/geometric-signature";
import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

export interface ArchetypeSummaryTileProps {
	readonly name: string;
	readonly oceanCode5: OceanCode5;
	readonly description: string;
	readonly className?: string;
	/**
	 * `inline` — single row (title + code | signature), for carousels.
	 * `split` — responsive two-column header (left stack | trailing), for results `ArchetypeCard`.
	 */
	readonly headerLayout?: "inline" | "split";
	readonly nameAs?: "h2" | "h3";
	readonly nameClassName?: string;
	readonly nameTestId?: string;
	/** Replaces the default mono `oceanCode5` line. */
	readonly codeRow?: ReactNode;
	/** Placed under the code row inside the left column. */
	readonly afterCodeRow?: ReactNode;
	/**
	 * Right side of the header row. Defaults to {@link GeometricSignature} when omitted
	 * (inline layout only uses the default; split layout should pass e.g. confidence UI).
	 */
	readonly trailing?: ReactNode;
	readonly descriptionClassName?: string;
	readonly descriptionTestId?: string;
}

/**
 * Compact archetype block (title, codes, optional hieroglyph row, optional right column, blurb).
 * Wrap with {@link ArtifactSurfaceCard} for bordered marketing / carousel shells.
 */
export function ArchetypeSummaryTile({
	name,
	oceanCode5,
	description,
	className,
	headerLayout = "inline",
	nameAs = "h3",
	nameClassName,
	nameTestId,
	codeRow,
	afterCodeRow,
	trailing,
	descriptionClassName,
	descriptionTestId,
}: ArchetypeSummaryTileProps) {
	const Heading = nameAs;
	const nameClasses = cn(
		nameAs === "h3" &&
			"font-heading text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50",
		nameAs === "h2" && "text-2xl font-bold tracking-tight text-foreground md:text-3xl",
		nameClassName,
	);

	const headerRowClass =
		headerLayout === "split"
			? "mt-2 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
			: "flex items-start justify-between gap-3";

	const leftColClass = headerLayout === "split" ? "min-w-0 flex-1" : undefined;

	const rightColumn =
		trailing !== undefined ? trailing : <GeometricSignature oceanCode5={oceanCode5} size="card" />;

	return (
		<div data-slot="archetype-summary-tile" className={cn(className)}>
			<div className={headerRowClass}>
				<div className={leftColClass}>
					<Heading className={nameClasses} data-testid={nameTestId}>
						{name}
					</Heading>
					{codeRow ?? (
						<p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{oceanCode5}</p>
					)}
					{afterCodeRow}
				</div>
				{headerLayout === "split" ? rightColumn : <div className="shrink-0">{rightColumn}</div>}
			</div>
			<p
				className={cn(
					"mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300",
					descriptionClassName,
				)}
				data-testid={descriptionTestId}
			>
				{description}
			</p>
		</div>
	);
}
