import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

interface OceanIconProps {
	size?: number;
	className?: string;
}

interface OceanIconBaseProps extends OceanIconProps {
	children: ReactNode;
}

function OceanIconBase({ size = 24, className, children }: OceanIconBaseProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			data-slot="ocean-icon"
			className={cn("shrink-0", className)}
		>
			{children}
		</svg>
	);
}

export function ShellIcon({ size = 24, className }: OceanIconProps) {
	return (
		<OceanIconBase size={size} className={className}>
			<path d="M12 20V12" />
			<path d="M6 20C6 14.5 8.7 10 12 10C15.3 10 18 14.5 18 20" />
			<path d="M12 4C7.6 4 4 7.6 4 12H20C20 7.6 16.4 4 12 4Z" />
		</OceanIconBase>
	);
}

export function CompassIcon({ size = 24, className }: OceanIconProps) {
	return (
		<OceanIconBase size={size} className={className}>
			<circle cx="12" cy="12" r="9" />
			<path d="M14.8 9.2L13.2 13.2L9.2 14.8L10.8 10.8L14.8 9.2Z" />
		</OceanIconBase>
	);
}

export function AnchorIcon({ size = 24, className }: OceanIconProps) {
	return (
		<OceanIconBase size={size} className={className}>
			<path d="M12 4V14" />
			<circle cx="12" cy="5" r="2" />
			<path d="M7 11H17" />
			<path d="M5 14C5 18.4183 8.13401 20 12 20C15.866 20 19 18.4183 19 14" />
		</OceanIconBase>
	);
}

export function BubbleIcon({ size = 24, className }: OceanIconProps) {
	return (
		<OceanIconBase size={size} className={className}>
			<circle cx="11" cy="11" r="6" />
			<circle cx="17" cy="7" r="2" />
		</OceanIconBase>
	);
}

export function WaveIcon({ size = 24, className }: OceanIconProps) {
	return (
		<OceanIconBase size={size} className={className}>
			<path d="M2 14C4 10 6 10 8 14C10 18 12 18 14 14C16 10 18 10 20 14C21 16 22 16 22 16" />
			<path d="M2 9C4 5 6 5 8 9C10 13 12 13 14 9C16 5 18 5 20 9C21 11 22 11 22 11" />
		</OceanIconBase>
	);
}

export function PearlIcon({ size = 24, className }: OceanIconProps) {
	return (
		<OceanIconBase size={size} className={className}>
			<path d="M4 10C4 7.79086 5.79086 6 8 6H16C18.2091 6 20 7.79086 20 10V10H4Z" />
			<circle cx="12" cy="14.5" r="3.5" />
		</OceanIconBase>
	);
}

export function RisingBubblesIcon({ size = 24, className }: OceanIconProps) {
	return (
		<OceanIconBase size={size} className={className}>
			<circle cx="8" cy="17" r="3" />
			<circle cx="15" cy="12" r="2.5" />
			<circle cx="19" cy="7" r="2" />
		</OceanIconBase>
	);
}

export function LighthouseIcon({ size = 24, className }: OceanIconProps) {
	return (
		<OceanIconBase size={size} className={className}>
			<path d="M10 20H14L13 10H11L10 20Z" />
			<path d="M11 10H13L15 6H9L11 10Z" />
			<path d="M8 22H16" />
			<path d="M15 8L20 6" />
			<path d="M9 8L4 6" />
		</OceanIconBase>
	);
}
