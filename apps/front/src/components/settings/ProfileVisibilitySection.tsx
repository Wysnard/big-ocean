import { Switch } from "@workspace/ui/components/switch";
import { Loader2 } from "lucide-react";

interface ProfileVisibilitySectionProps {
	publicProfileId: string | null;
	isPublic: boolean;
	isTogglePending: boolean;
	onToggleVisibility: () => void;
}

export function ProfileVisibilitySection({
	publicProfileId,
	isPublic,
	isTogglePending,
	onToggleVisibility,
}: ProfileVisibilitySectionProps) {
	const isDisabled = !publicProfileId || isTogglePending;

	return (
		<div
			data-slot="profile-visibility-section"
			className="rounded-2xl border border-border bg-card p-6"
		>
			<div className="flex flex-col gap-4">
				<div>
					<h3 className="text-lg font-semibold text-foreground">Profile Visibility</h3>
					<p className="text-sm text-muted-foreground mt-1">
						Control whether your personality profile is publicly accessible.
					</p>
				</div>

				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Switch
							data-testid="profile-visibility-toggle"
							checked={isPublic}
							onCheckedChange={onToggleVisibility}
							disabled={isDisabled}
							aria-label={isPublic ? "Make profile private" : "Make profile public"}
						/>
						<span data-testid="profile-visibility-status" className="text-sm font-medium text-foreground">
							{isPublic ? "Public" : "Private"}
						</span>
						{isTogglePending && (
							<Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin text-muted-foreground" />
						)}
					</div>
				</div>

				{!publicProfileId && (
					<p className="text-xs text-muted-foreground">
						Complete an assessment to unlock profile visibility controls.
					</p>
				)}
			</div>
		</div>
	);
}
