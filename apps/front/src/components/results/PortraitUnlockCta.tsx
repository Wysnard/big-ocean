/**
 * Portrait Unlock CTA (Story 3.4 — AC4)
 *
 * Persistent breathing button shown in the portrait section when the
 * user hasn't yet purchased their portrait. Tapping reopens the PWYW modal.
 */

import { Button } from "@workspace/ui/components/button";
import { Sparkles } from "lucide-react";
import { forwardRef } from "react";

interface PortraitUnlockCtaProps {
	onUnlock: () => void;
}

export const PortraitUnlockCta = forwardRef<HTMLButtonElement, PortraitUnlockCtaProps>(
	function PortraitUnlockCta({ onUnlock }, ref) {
		return (
			<div
				data-slot="portrait-unlock-cta"
				className="col-span-full rounded-2xl border border-border bg-card p-6 text-center space-y-3"
			>
				<p className="text-sm text-muted-foreground">
					Nerin wrote you a personal letter about who you are — unlock it to read what surfaced.
				</p>
				<Button
					ref={ref}
					data-testid="portrait-unlock-cta"
					className="min-h-12 px-8 text-base font-medium motion-safe:animate-pulse"
					onClick={onUnlock}
				>
					<Sparkles className="w-5 h-5 mr-2" />
					Unlock your portrait
				</Button>
			</div>
		);
	},
);
