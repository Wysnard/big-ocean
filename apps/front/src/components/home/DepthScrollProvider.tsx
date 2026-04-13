import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { HomepagePhase } from "./homepage-phase-config";
import { HOMEPAGE_PHASE_ORDER, isHomepagePhase } from "./homepage-phase-config";

interface DepthScrollContextValue {
	scrollPercent: number;
	currentPhase: HomepagePhase;
}

const DepthScrollContext = createContext<DepthScrollContextValue>({
	scrollPercent: 0,
	currentPhase: "conversation",
});

export function useDepthScroll() {
	return useContext(DepthScrollContext);
}

export function useHomepagePhase() {
	return useContext(DepthScrollContext).currentPhase;
}

export function DepthScrollProvider({ children }: { children: React.ReactNode }) {
	const [scrollPercent, setScrollPercent] = useState(0);
	const [currentPhase, setCurrentPhase] = useState<HomepagePhase>("conversation");

	const resolveHomepagePhase = useCallback((): HomepagePhase => {
		if (typeof window === "undefined" || window.innerWidth < 1024) {
			return "conversation";
		}

		const phaseSections = Array.from(document.querySelectorAll<HTMLElement>("[data-homepage-phase]"));
		if (phaseSections.length === 0) {
			return "conversation";
		}

		const viewportMidpoint = window.innerHeight * 0.5;
		for (const section of phaseSections) {
			const candidatePhase = section.dataset.homepagePhase;
			if (!isHomepagePhase(candidatePhase)) {
				continue;
			}

			const rect = section.getBoundingClientRect();
			if (rect.top <= viewportMidpoint && rect.bottom > viewportMidpoint) {
				return candidatePhase;
			}
		}

		const firstSection = phaseSections[0];
		const lastSection = phaseSections.at(-1);
		const firstPhase = firstSection?.dataset.homepagePhase;
		const lastPhase = lastSection?.dataset.homepagePhase;

		if (firstSection && firstSection.getBoundingClientRect().top > viewportMidpoint) {
			return isHomepagePhase(firstPhase) ? firstPhase : HOMEPAGE_PHASE_ORDER[0];
		}

		return isHomepagePhase(lastPhase)
			? lastPhase
			: HOMEPAGE_PHASE_ORDER[HOMEPAGE_PHASE_ORDER.length - 1];
	}, []);

	const onScroll = useCallback(() => {
		const scrollHeight = document.body.scrollHeight - window.innerHeight;
		const p = scrollHeight > 0 ? Math.min(window.scrollY / scrollHeight, 1) : 0;
		setScrollPercent(p);
		setCurrentPhase(resolveHomepagePhase());
	}, [resolveHomepagePhase]);

	useEffect(() => {
		let ticking = false;
		const handler = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					onScroll();
					ticking = false;
				});
				ticking = true;
			}
		};
		window.addEventListener("scroll", handler, { passive: true });
		window.addEventListener("resize", handler);
		onScroll();
		return () => {
			window.removeEventListener("scroll", handler);
			window.removeEventListener("resize", handler);
		};
	}, [onScroll]);

	return (
		<DepthScrollContext value={{ scrollPercent, currentPhase }}>
			<div data-slot="depth-scroll-provider">{children}</div>
		</DepthScrollContext>
	);
}
