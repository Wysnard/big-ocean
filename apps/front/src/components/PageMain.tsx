import { cn } from "@workspace/ui/lib/utils";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

export const MAIN_CONTENT_ID = "main-content";

interface PageMainProps extends ComponentPropsWithoutRef<"main"> {
	title?: string;
	titleClassName?: string;
}

export function PageMain({
	title,
	titleClassName = "sr-only",
	className,
	children,
	...props
}: PageMainProps) {
	return (
		<main id={MAIN_CONTENT_ID} tabIndex={-1} className={cn(className)} {...props}>
			{title ? <h1 className={titleClassName}>{title}</h1> : null}
			{children}
		</main>
	);
}

export function SkipToContentLink() {
	const focusMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
		const mainContent = document.getElementById(MAIN_CONTENT_ID);
		if (!mainContent) return;

		event.preventDefault();
		mainContent.focus();
		mainContent.scrollIntoView({ block: "start" });
	};

	return (
		<a
			href={`#${MAIN_CONTENT_ID}`}
			data-testid="skip-to-content"
			onClick={focusMainContent}
			className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
			Skip to content
		</a>
	);
}
