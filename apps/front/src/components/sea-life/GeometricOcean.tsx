import { useEffect, useRef, useState } from "react";
import { Bubbles } from "./Bubbles";

interface GeometricOceanProps {
	/** 0-1 float representing conversation depth progress */
	depthProgress?: number;
	/** When true, creatures briefly intensify (reverts after 3s) */
	pulse?: boolean;
	className?: string;
}

/** Full-scene ambient ocean layer. Decorative only — aria-hidden, pointer-events: none. */
export function GeometricOcean({
	depthProgress = 0,
	pulse = false,
	className,
}: GeometricOceanProps) {
	const [isPulsing, setIsPulsing] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (pulse) {
			setIsPulsing(true);
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => setIsPulsing(false), 3000);
		}
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [pulse]);

	const depth = depthProgress >= 0.6 ? "deep" : "surface";

	return (
		<div
			data-slot="geometric-ocean-layer"
			data-depth={depth}
			aria-hidden="true"
			className={`geometric-ocean absolute inset-0 z-0 pointer-events-none overflow-hidden ${isPulsing ? "pulse" : ""} ${className ?? ""}`}
		>
			<Bubbles />
		</div>
	);
}
