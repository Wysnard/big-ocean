import { cn } from "@workspace/ui/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type MePageSectionAction = {
	label: string;
	onClick: () => void;
};

interface MePageSectionProps extends ComponentPropsWithoutRef<"section"> {
	title: string;
	children: ReactNode;
	action?: MePageSectionAction;
	isConditional?: boolean;
	className?: string;
}

export function MePageSection({
	title,
	children,
	action,
	isConditional = false,
	className,
	...props
}: MePageSectionProps) {
	return (
		<section
			aria-label={title}
			className={cn(
				"rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8",
				"scroll-mt-24",
				className,
			)}
			{...props}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<h2 className="font-heading text-2xl font-bold text-foreground">{title}</h2>
						{isConditional ? (
							<span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
								Conditional
							</span>
						) : null}
					</div>
				</div>

				{action ? (
					<button
						type="button"
						onClick={action.onClick}
						className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
					>
						{action.label}
					</button>
				) : null}
			</div>

			<div className="mt-5">{children}</div>
		</section>
	);
}
