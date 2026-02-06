import { useEffect } from "react";

interface ErrorBannerProps {
	message: string;
	onRetry?: () => void;
	onDismiss: () => void;
	autoDismissMs?: number;
}

/**
 * Transient error banner for displaying inline error messages.
 * Auto-dismisses after a configurable timeout (default 5 seconds).
 */
export function ErrorBanner({
	message,
	onRetry,
	onDismiss,
	autoDismissMs = 5000,
}: ErrorBannerProps) {
	useEffect(() => {
		if (autoDismissMs > 0) {
			const timer = setTimeout(onDismiss, autoDismissMs);
			return () => clearTimeout(timer);
		}
	}, [autoDismissMs, onDismiss]);

	return (
		<div className="mx-4 mb-2 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-center justify-between">
			<p className="text-sm text-red-200">{message}</p>
			<div className="flex gap-2">
				{onRetry && (
					<button type="button" onClick={onRetry} className="text-xs text-red-300 hover:text-white">
						Retry
					</button>
				)}
				<button type="button" onClick={onDismiss} className="text-xs text-red-400 hover:text-red-200">
					&times;
				</button>
			</div>
		</div>
	);
}
