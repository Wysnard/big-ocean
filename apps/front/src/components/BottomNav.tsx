import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@workspace/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Sun, UserRound, Users } from "lucide-react";

type ThreeSpaceTab = {
	id: "today" | "me" | "circle";
	label: string;
	to: "/today" | "/me" | "/circle";
	icon: LucideIcon;
};

const THREE_SPACE_TABS: ThreeSpaceTab[] = [
	{ id: "today", label: "Today", to: "/today", icon: Sun },
	{ id: "me", label: "Me", to: "/me", icon: UserRound },
	{ id: "circle", label: "Circle", to: "/circle", icon: Users },
];

const HIDDEN_ROUTE_PREFIXES = ["/chat", "/results", "/settings", "/today/week/"] as const;

function getActiveTabId(pathname: string): ThreeSpaceTab["id"] | null {
	if (HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		return null;
	}

	if (pathname === "/today" || pathname.startsWith("/today/")) {
		return "today";
	}

	if (pathname === "/me" || pathname.startsWith("/me/")) {
		return "me";
	}

	if (pathname === "/circle" || pathname.startsWith("/circle/")) {
		return "circle";
	}

	return null;
}

function NavTab({
	tab,
	activeTabId,
	variant,
}: {
	tab: ThreeSpaceTab;
	activeTabId: ThreeSpaceTab["id"] | null;
	variant: "mobile" | "desktop";
}) {
	const Icon = tab.icon;
	const isActive = activeTabId === tab.id;

	return (
		<Link
			to={tab.to}
			data-slot="bottom-nav-tab"
			data-testid={`bottom-nav-tab-${tab.id}-${variant}`}
			data-state={isActive ? "active" : "inactive"}
			className={cn(
				"flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
				"data-[state=active]:bg-foreground data-[state=active]:text-background",
				"data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground",
				variant === "mobile" ? "flex-1" : "min-w-28",
			)}
		>
			<Icon className="size-4" aria-hidden="true" />
			<span>{tab.label}</span>
		</Link>
	);
}

export function BottomNav() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const activeTabId = getActiveTabId(pathname);

	if (!activeTabId) {
		return null;
	}

	return (
		<div data-slot="bottom-nav-root" data-testid="bottom-nav-root">
			<nav
				aria-label="Three-space navigation"
				data-slot="bottom-nav-desktop"
				data-testid="bottom-nav-desktop"
				className="sticky top-14 z-40 hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:block"
			>
				<div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
					{THREE_SPACE_TABS.map((tab) => (
						<NavTab key={tab.id} tab={tab} activeTabId={activeTabId} variant="desktop" />
					))}
				</div>
			</nav>

			<nav
				aria-label="Three-space navigation mobile"
				data-slot="bottom-nav-mobile"
				data-testid="bottom-nav-mobile"
				className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden"
			>
				<div className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-border bg-card/80 p-2">
					{THREE_SPACE_TABS.map((tab) => (
						<NavTab key={tab.id} tab={tab} activeTabId={activeTabId} variant="mobile" />
					))}
				</div>
			</nav>
		</div>
	);
}
