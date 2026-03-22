import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Loader2 } from "lucide-react";

interface PublicVisibilityPromptProps {
	open: boolean;
	onAccept: () => void;
	onDecline: () => void;
	isLoading: boolean;
}

export function PublicVisibilityPrompt({
	open,
	onAccept,
	onDecline,
	isLoading,
}: PublicVisibilityPromptProps) {
	return (
		<Dialog open={open} onOpenChange={(v) => !v && onDecline()}>
			<DialogContent data-slot="visibility-prompt" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Share your profile?</DialogTitle>
					<DialogDescription>
						Make your profile public so friends can see your archetype when they tap your link?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						data-testid="visibility-prompt-decline"
						variant="outline"
						onClick={onDecline}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button data-testid="visibility-prompt-accept" onClick={onAccept} disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 motion-safe:animate-spin" />
								Making public...
							</>
						) : (
							"Make public & share"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
