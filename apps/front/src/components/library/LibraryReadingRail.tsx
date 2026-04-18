import { Link } from "@tanstack/react-router";
import { cn } from "@workspace/ui/lib/utils";
import { BookOpenText, ChevronDown } from "lucide-react";
import { useLibraryScrollSpy } from "@/hooks/useLibraryScrollSpy";
import { LIBRARY_STICKY_TOP_LG_CLASS } from "@/lib/library-layout";

export type LibraryReadingChapter = { readonly id: string; readonly label: string };

function ReadingRailList({
	chapters,
	activeId,
	variant = "drawer",
}: {
	chapters: readonly LibraryReadingChapter[];
	activeId: string | null;
	/** Sticky desktop rail: stronger active affordances; drawer stays compact for small screens. */
	variant?: "drawer" | "rail";
}) {
	const isRail = variant === "rail";

	return (
		<ol className={cn("mt-4 text-sm", isRail ? "space-y-2" : "space-y-1.5")}>
			{chapters.map((chapter, index) => {
				const isActive = chapter.id === activeId;
				return (
					<li
						key={chapter.id}
						data-active={isActive}
						aria-current={isActive ? "location" : undefined}
						className={cn(
							"rounded-xl border border-border/70 border-l-4 border-l-transparent bg-muted/20 py-0.5 transition-[background-color,border-color,box-shadow,ring-color] duration-200",
							"hover:border-border",
							"data-[active=true]:border-primary/40 data-[active=true]:border-l-primary data-[active=true]:bg-primary/[0.11] data-[active=true]:shadow-sm",
							isRail &&
								"py-1 data-[active=true]:shadow-md data-[active=true]:shadow-primary/10 data-[active=true]:ring-1 data-[active=true]:ring-primary/20",
						)}
					>
						<Link
							to="."
							hash={chapter.id}
							className={cn(
								"flex cursor-pointer items-start gap-2.5 rounded-lg px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								isRail ? "min-h-12 py-2.5" : "min-h-11 py-2",
								isActive ? "text-foreground" : "text-muted-foreground",
							)}
						>
							<span
								className={cn(
									"mt-0.5 flex shrink-0 items-center justify-center rounded-md font-semibold tabular-nums leading-none",
									isRail ? "size-8 text-[0.7rem]" : "size-7 text-[0.65rem]",
									isActive ? "bg-primary/20 text-primary" : "bg-muted/60 text-muted-foreground",
								)}
								aria-hidden
							>
								{String(index + 1).padStart(2, "0")}
							</span>
							<span
								className={cn(
									"leading-snug",
									isActive && "font-semibold text-foreground",
									isRail && isActive && "tracking-[-0.01em]",
								)}
							>
								{chapter.label}
							</span>
						</Link>
					</li>
				);
			})}
		</ol>
	);
}

export function LibraryReadingRail({
	articlePath: _articlePath,
	chapters,
}: {
	articlePath?: string;
	chapters: readonly LibraryReadingChapter[];
}) {
	const chapterIds = chapters.map((c) => c.id);
	const activeId = useLibraryScrollSpy(chapterIds);
	const activeChapter = activeId ? chapters.find((c) => c.id === activeId) : undefined;

	return (
		<aside className={cn("space-y-4 lg:sticky lg:self-start", LIBRARY_STICKY_TOP_LG_CLASS)}>
			<details
				aria-label="On this page"
				className="group rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm lg:hidden"
			>
				<summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
					<BookOpenText className="size-4 shrink-0 text-primary" aria-hidden />
					<span>On this page</span>
					{activeChapter ? (
						<span className="ml-2 truncate text-xs font-normal text-muted-foreground">
							· {activeChapter.label}
						</span>
					) : null}
					<ChevronDown
						className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
						aria-hidden
					/>
				</summary>
				<ReadingRailList chapters={chapters} activeId={activeId} />
			</details>

			<nav
				aria-label="On this page"
				className="hidden rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm lg:block"
			>
				<div className="flex items-center gap-2 text-sm font-medium text-foreground">
					<BookOpenText className="size-4 shrink-0 text-primary" aria-hidden />
					Reading rail
				</div>
				<ReadingRailList chapters={chapters} activeId={activeId} variant="rail" />
			</nav>
		</aside>
	);
}
