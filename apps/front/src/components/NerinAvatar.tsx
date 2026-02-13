import { cn } from "@workspace/ui/lib/utils";

interface NerinAvatarProps {
	size?: number;
	confidence?: number;
	className?: string;
}

const TIER_STYLES = {
	low: "opacity-40 drop-shadow-[0_0_4px_var(--primary)]",
	mid: "opacity-70 drop-shadow-[0_0_8px_var(--primary)]",
	high: "opacity-100 drop-shadow-[0_0_12px_var(--primary)]",
} as const;

export function NerinAvatar({ size = 40, confidence = 100, className }: NerinAvatarProps) {
	const clampedConfidence = Math.max(0, Math.min(100, confidence));
	const tier = clampedConfidence <= 30 ? "low" : clampedConfidence <= 60 ? "mid" : "high";

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 120 120"
			fill="none"
			aria-hidden="true"
			data-slot="nerin-avatar"
			className={cn("shrink-0 text-primary", TIER_STYLES[tier], className)}
		>
			<circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="2" opacity="0.35" />
			<path
				d="M60 30C66.6274 30 72 35.3726 72 42C72 48.6274 66.6274 54 60 54C53.3726 54 48 48.6274 48 42C48 35.3726 53.3726 30 60 30Z"
				fill="currentColor"
				opacity="0.85"
			/>
			<path
				d="M43 100C43 85.6406 50.6112 73 60 73C69.3888 73 77 85.6406 77 100"
				stroke="currentColor"
				strokeWidth="8"
				strokeLinecap="round"
			/>
			<path
				d="M36 84C43.5 81.5 50.5 77 54.5 70.5M84 84C76.5 81.5 69.5 77 65.5 70.5"
				stroke="currentColor"
				strokeWidth="5"
				strokeLinecap="round"
				opacity="0.8"
			/>
			<ellipse cx="60" cy="88" rx="16" ry="22" fill="currentColor" opacity="0.2" />
			<circle cx="34" cy="36" r="6" fill="var(--secondary)" opacity="0.35" />
			<circle cx="91" cy="47" r="5" fill="var(--secondary)" opacity="0.3" />
			<circle cx="89" cy="88" r="4" fill="var(--secondary)" opacity="0.25" />
		</svg>
	);
}
