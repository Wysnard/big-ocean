/**
 * Portrait Section Orchestrator (Story 32-5)
 *
 * Renders the appropriate portrait display state within the results grid:
 * - "none": Unlock CTA (if onUnlock provided) or empty
 * - "generating": Skeleton pulse with "Nerin is writing..." label
 * - "ready": Full portrait via PersonalPortrait component
 * - "failed": Error message with retry button
 */

import type { PortraitStatus } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import { Loader2, RefreshCw } from "lucide-react";
import { memo } from "react";
import { PersonalPortrait } from "./PersonalPortrait";
import { PortraitUnlockCta } from "./PortraitUnlockCta";

interface PortraitSectionProps {
	status: PortraitStatus;
	content?: string | null;
	displayName?: string | null;
	onUnlock?: () => void;
	onRetry?: () => void;
}

export const PortraitSection = memo(function PortraitSection({
	status,
	content,
	displayName,
	onUnlock,
	onRetry,
}: PortraitSectionProps) {
	return (
		<div data-testid="portrait-section" data-slot="portrait-section" className="col-span-full">
			{status === "none" && onUnlock && <PortraitUnlockCta onUnlock={onUnlock} />}

			{status === "generating" && (
				<div
					data-testid="portrait-generating"
					className="col-span-full rounded-2xl border border-border bg-card p-6"
				>
					<div className="flex flex-col items-center justify-center py-8 gap-4">
						<Loader2 className="w-8 h-8 text-primary motion-safe:animate-spin" />
						<div className="text-center">
							<p className="text-sm font-medium text-foreground">Nerin is writing...</p>
							<p className="text-xs text-muted-foreground mt-1">This may take a minute</p>
						</div>
					</div>
				</div>
			)}

			{status === "ready" && (
				<PersonalPortrait
					displayName={displayName}
					fullPortraitContent={content}
					fullPortraitStatus="ready"
				/>
			)}

			{status === "failed" && (
				<div
					data-testid="portrait-failed"
					className="col-span-full rounded-2xl border border-border bg-card p-6"
				>
					<div className="flex flex-col items-center justify-center py-8 gap-4">
						<div className="text-center">
							<p className="text-sm font-medium text-foreground">Portrait generation failed</p>
							<p className="text-xs text-muted-foreground mt-1">Please try again</p>
						</div>
						{onRetry && (
							<Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
								<RefreshCw className="w-4 h-4" />
								Retry
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
});
