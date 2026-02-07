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

	// Calculate label based on progress
	const defaultLabel = useMemo(() => {
		if (clampedValue > 80) return "You're nearly there!";
		return `${Math.round(clampedValue)}% assessed`;
	}, [clampedValue]);

	const displayLabel = label ?? defaultLabel;
	const showPercentageValue = showPercentage && clampedValue <= 80;

	return (
		<div className={`w-full max-w-md mx-auto px-4 py-2 ${className}`}>
			{/* Label and percentage */}
			<div className="flex items-center justify-between mb-1 text-sm">
				<span className="text-slate-300">{displayLabel}</span>
				{showPercentageValue && (
					<span className="text-slate-400 font-medium">{Math.round(clampedValue)}%</span>
				)}
			</div>

			{/* Progress bar track */}
			<div
				data-testid="progress-track"
				className="w-full bg-slate-700 h-3 rounded-full overflow-hidden"
			>
				{/* Progress bar fill */}
				<div
					data-testid="progress-fill"
					className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-in-out"
					style={{ width: `${clampedValue}%` }}
				/>
			</div>
		</div>
	);
};
