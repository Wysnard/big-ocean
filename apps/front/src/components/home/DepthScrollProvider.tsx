import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface DepthScrollContextValue {
	scrollPercent: number;
}

const DepthScrollContext = createContext<DepthScrollContextValue>({
	scrollPercent: 0,
});

export function useDepthScroll() {
	return useContext(DepthScrollContext);
}

export function DepthScrollProvider({ children }: { children: React.ReactNode }) {
	const [scrollPercent, setScrollPercent] = useState(0);

	const onScroll = useCallback(() => {
		const scrollHeight = document.body.scrollHeight - window.innerHeight;
		const p = scrollHeight > 0 ? Math.min(window.scrollY / scrollHeight, 1) : 0;
		setScrollPercent(p);
	}, []);

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
		onScroll();
		return () => window.removeEventListener("scroll", handler);
	}, [onScroll]);

	return (
		<DepthScrollContext value={{ scrollPercent }}>
			<div data-slot="depth-scroll-provider">{children}</div>
		</DepthScrollContext>
	);
}
