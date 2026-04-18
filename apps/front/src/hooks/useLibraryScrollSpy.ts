import { useEffect, useState } from "react";
import { LIBRARY_SCROLL_SPY_STICKY_OFFSET_PX } from "@/lib/library-layout";
import { pickActiveLibraryChapterId } from "@/lib/pick-active-library-chapter";

/**
 * Tracks the reading-rail chapter aligned with scroll position.
 *
 * Uses a scroll/resize-driven measure (not IntersectionObserver entry batches), so
 * the active id stays stable when multiple sections intersect the root margin.
 */
export function useLibraryScrollSpy(chapterIds: readonly string[]) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const idsKey = chapterIds.join("|");

	useEffect(() => {
		setActiveId(null);
		if (typeof window === "undefined") {
			return;
		}

		const ids = idsKey.length > 0 ? idsKey.split("|") : [];
		if (ids.length === 0) {
			setActiveId(null);
			return;
		}

		const measure = () =>
			pickActiveLibraryChapterId(
				ids,
				(id) => document.getElementById(id)?.getBoundingClientRect().top ?? null,
				LIBRARY_SCROLL_SPY_STICKY_OFFSET_PX,
			);

		let rafId = 0;
		const schedule = () => {
			cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => {
				setActiveId(measure());
			});
		};

		schedule();

		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
		};
	}, [idsKey]);

	return activeId;
}
