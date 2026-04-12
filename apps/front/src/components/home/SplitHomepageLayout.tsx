import type { ReactNode } from "react";

interface SplitHomepageLayoutProps {
	timeline: ReactNode;
	authPanel: ReactNode;
	bottomCta?: ReactNode;
}

export function SplitHomepageLayout({ timeline, authPanel, bottomCta }: SplitHomepageLayoutProps) {
	return (
		<div
			data-slot="split-homepage-layout"
			data-testid="split-homepage-layout"
			className="grid grid-cols-[1fr] lg:grid-cols-[3fr_2fr]"
		>
			{/* Left pane — scrollable timeline content */}
			<div
				data-slot="scrollable-timeline"
				data-testid="scrollable-timeline"
				className="overflow-y-auto lg:h-[calc(100vh-3.5rem)]"
			>
				{timeline}
			</div>

			{/* Right pane — sticky auth panel (desktop only) */}
			<div
				data-slot="sticky-auth-panel-wrapper"
				data-testid="sticky-auth-panel-wrapper"
				className="hidden lg:block lg:sticky lg:top-[3.5rem] lg:h-[calc(100vh-3.5rem)]"
			>
				{authPanel}
			</div>

			{/* Mobile bottom CTA (visible only on small screens) */}
			{bottomCta}
		</div>
	);
}
