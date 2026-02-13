import { cn } from "@workspace/ui/lib/utils";

interface OceanDecorativeProps {
	className?: string;
}

export function WaveDecoration({ className }: OceanDecorativeProps) {
	return (
		<svg
			viewBox="0 0 160 48"
			fill="none"
			aria-hidden="true"
			data-slot="wave-decoration"
			className={cn("h-auto w-full opacity-10", className)}
		>
			<path
				d="M4 28C20 14 36 14 52 28C68 42 84 42 100 28C116 14 132 14 148 28"
				stroke="var(--primary)"
				strokeWidth="4"
				strokeLinecap="round"
			/>
			<path
				d="M12 38C28 24 44 24 60 38C76 52 92 52 108 38C124 24 140 24 156 38"
				stroke="var(--tertiary)"
				strokeWidth="3"
				strokeLinecap="round"
				opacity="0.8"
			/>
		</svg>
	);
}

export function BubblesDecoration({ className }: OceanDecorativeProps) {
	return (
		<svg
			viewBox="0 0 120 120"
			fill="none"
			aria-hidden="true"
			data-slot="bubbles-decoration"
			className={cn("h-auto w-full opacity-10", className)}
		>
			<circle cx="20" cy="92" r="8" stroke="var(--primary)" strokeWidth="3" />
			<circle cx="44" cy="70" r="11" stroke="var(--secondary)" strokeWidth="3" />
			<circle cx="72" cy="50" r="8" stroke="var(--tertiary)" strokeWidth="3" />
			<circle cx="98" cy="26" r="6" stroke="var(--primary)" strokeWidth="3" />
		</svg>
	);
}

export function CoralDecoration({ className }: OceanDecorativeProps) {
	return (
		<svg
			viewBox="0 0 96 120"
			fill="none"
			aria-hidden="true"
			data-slot="coral-decoration"
			className={cn("h-auto w-full opacity-10", className)}
		>
			<path
				d="M48 112V78M48 78C48 56 62 48 62 34M48 78C48 62 35 54 35 38M48 92C48 76 22 74 22 56M48 90C48 74 74 72 74 54"
				stroke="var(--secondary)"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="22" cy="56" r="4" fill="var(--primary)" />
			<circle cx="74" cy="54" r="4" fill="var(--tertiary)" />
		</svg>
	);
}

export function SeaweedDecoration({ className }: OceanDecorativeProps) {
	return (
		<svg
			viewBox="0 0 120 120"
			fill="none"
			aria-hidden="true"
			data-slot="seaweed-decoration"
			className={cn("h-auto w-full opacity-10", className)}
		>
			<path
				d="M26 118C34 92 20 74 28 50C33 36 43 26 50 8"
				stroke="var(--tertiary)"
				strokeWidth="5"
				strokeLinecap="round"
			/>
			<path
				d="M58 118C64 88 52 70 62 44C68 28 78 18 84 6"
				stroke="var(--secondary)"
				strokeWidth="5"
				strokeLinecap="round"
			/>
			<path
				d="M88 118C94 96 86 80 94 56C98 44 106 34 112 20"
				stroke="var(--primary)"
				strokeWidth="5"
				strokeLinecap="round"
			/>
		</svg>
	);
}
