/**
 * Account Deletion Section (Story 30-2)
 *
 * Renders a "Delete Account" button with a confirmation dialog.
 * Requires user to type "DELETE" to confirm.
 */

import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface AccountDeletionSectionProps {
	onDelete: () => Promise<void>;
	isDeleting: boolean;
}

export function AccountDeletionSection({ onDelete, isDeleting }: AccountDeletionSectionProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [confirmText, setConfirmText] = useState("");
	const [error, setError] = useState<string | null>(null);

	const isConfirmed = confirmText === "DELETE";

	const handleDelete = async () => {
		setError(null);
		try {
			await onDelete();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete account. Please try again.");
		}
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setConfirmText("");
			setError(null);
		}
	};

	return (
		<div
			data-slot="account-deletion-section"
			className="rounded-2xl border border-destructive/30 bg-card p-6"
		>
			<div className="flex flex-col gap-4">
				<div>
					<h3 className="text-lg font-semibold text-destructive">Delete Account</h3>
					<p className="text-sm text-muted-foreground mt-1">
						Permanently delete your account and all associated data. This action cannot be undone.
					</p>
				</div>

				<Dialog open={isOpen} onOpenChange={handleOpenChange}>
					<DialogTrigger asChild>
						<Button data-testid="delete-account-button" variant="destructive" className="w-fit">
							Delete Account
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete your account?</DialogTitle>
							<DialogDescription>
								This will permanently delete your account and all your data, including assessment results,
								portraits, relationship analyses, and purchase history. This action cannot be undone.
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-col gap-3 py-2">
							<label htmlFor="delete-confirm" className="text-sm font-medium text-foreground">
								Type <span className="font-mono font-bold">DELETE</span> to confirm
							</label>
							<input
								id="delete-confirm"
								data-testid="delete-confirm-input"
								type="text"
								value={confirmText}
								onChange={(e) => setConfirmText(e.target.value)}
								placeholder="DELETE"
								autoComplete="off"
								autoCapitalize="none"
								spellCheck={false}
								required
								aria-required="true"
								aria-describedby={error ? "delete-confirm-error" : undefined}
								className="flex min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isDeleting}
							/>
							{error && (
								<p
									id="delete-confirm-error"
									data-testid="delete-error-message"
									className="text-sm text-destructive"
								>
									{error}
								</p>
							)}
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
								Cancel
							</Button>
							<Button
								data-testid="delete-confirm-button"
								variant="destructive"
								onClick={handleDelete}
								disabled={!isConfirmed || isDeleting}
							>
								{isDeleting ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 motion-safe:animate-spin" />
										Deleting...
									</>
								) : (
									"Delete my account"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
