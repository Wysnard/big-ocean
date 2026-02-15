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
		<div
			data-slot="error-banner"
			className="mx-4 mb-2 p-3 bg-destructive/20 border border-destructive/30 rounded-lg flex items-center justify-between"
		>
			<p className="text-sm text-destructive">{message}</p>
			<div className="flex gap-2">
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="text-xs text-destructive hover:text-foreground"
					>
						Retry
					</button>
				)}
				<button
					type="button"
					onClick={onDismiss}
					className="text-xs text-destructive/70 hover:text-destructive"
				>
					&times;
				</button>
			</div>
		</div>
	);
}
