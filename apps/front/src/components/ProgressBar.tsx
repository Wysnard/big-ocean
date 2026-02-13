import type React from "react";
import { useMemo } from "react";

export interface ProgressBarProps {
	value: number; // 0-100 integer (current avg confidence)
	label?: string; // Optional custom label
	showPercentage?: boolean; // Default true
	className?: string; // Optional Tailwind classes
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
	value,
	label,
	showPercentage = true,
	className = "",
}) => {
	// Clamp value to 0-100
	const clampedValue = Math.min(Math.max(value, 0), 100);

	// Nerin-voice contextual labels based on progress
	const defaultLabel = useMemo(() => {
		if (clampedValue >= 80) return "Putting the finishing touches...";
		if (clampedValue >= 70) return "Almost there...";
		if (clampedValue >= 50) return "Building your profile...";
		if (clampedValue >= 25) return "Understanding your patterns...";
		return "Getting to know you...";
	}, [clampedValue]);

	const displayLabel = label ?? defaultLabel;
	const showPercentageValue = showPercentage && clampedValue <= 80;

	return (
		<div className={`w-full max-w-md mx-auto px-4 py-2 ${className}`}>
			{/* Label and percentage */}
			<div className="flex items-center justify-between mb-1 text-sm">
				<span className="text-foreground">{displayLabel}</span>
				{showPercentageValue && (
					<span className="text-muted-foreground font-medium">{Math.round(clampedValue)}%</span>
				)}
			</div>

			{/* Progress bar track */}
			<div
				data-testid="progress-track"
				role="progressbar"
				aria-valuenow={clampedValue}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={displayLabel}
				className="w-full bg-muted h-3 rounded-full overflow-hidden"
			>
				{/* Progress bar fill */}
				<div
					data-testid="progress-fill"
					className="h-full rounded-full transition-all duration-500 ease-in-out bg-primary"
					style={{ width: `${clampedValue}%` }}
				/>
			</div>
		</div>
	);
};
