import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export function MessageGroup({ children }: { children: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				setVisible(true);
			}
		}
	}, []);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(handleIntersect, {
			threshold: 0.12,
			rootMargin: "0px 0px -30px 0px",
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [handleIntersect]);

	return (
		<div
			ref={ref}
			data-slot="message-group"
			className="relative z-[1] mb-9 transition-all duration-[650ms] [transition-timing-function:cubic-bezier(.16,1,.3,1)] motion-reduce:!opacity-100 motion-reduce:!translate-y-0"
			style={{
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(26px)",
			}}
		>
			{children}
		</div>
	);
}
