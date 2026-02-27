/**
 * Invitation Bottom Sheet (Story 14.2)
 *
 * Displays QR code, copy-link, and native share for a created invitation.
 * Uses shadcn/ui Drawer (vaul) for a swipe-to-dismiss bottom sheet.
 */

import { Button } from "@workspace/ui/components/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@workspace/ui/components/drawer";
import { Check, Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useState } from "react";

interface InvitationBottomSheetProps {
	shareUrl: string;
	invitationToken: string;
	personalMessage?: string;
	onClose: () => void;
	open: boolean;
}

export function InvitationBottomSheet({
	shareUrl,
	personalMessage,
	onClose,
	open,
}: InvitationBottomSheetProps) {
	const [copied, setCopied] = useState(false);
	const canShare = typeof navigator !== "undefined" && !!navigator.share;

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback: select text from a temporary input
			const input = document.createElement("input");
			input.value = shareUrl;
			document.body.appendChild(input);
			input.select();
			document.execCommand("copy");
			document.body.removeChild(input);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [shareUrl]);

	const handleShare = useCallback(async () => {
		try {
			await navigator.share({
				title: "Personality Comparison",
				text: personalMessage || "Compare our personalities on Big Ocean!",
				url: shareUrl,
			});
		} catch {
			// User cancelled or share failed — no-op
		}
	}, [shareUrl, personalMessage]);

	return (
		<Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DrawerContent data-testid="invitation-bottom-sheet">
				<DrawerHeader className="text-center">
					<DrawerTitle>Share Your Invitation</DrawerTitle>
					<DrawerDescription>
						Share this link with someone to compare your personalities
					</DrawerDescription>
				</DrawerHeader>

				<div className="flex flex-col items-center gap-5 px-4 pb-6">
					{/* QR Code */}
					<div data-testid="qr-code" className="rounded-xl bg-white p-4 shadow-sm">
						<QRCodeSVG value={shareUrl} size={180} />
					</div>

					{/* Personal message */}
					{personalMessage && (
						<div className="w-full rounded-lg bg-muted/50 p-3">
							<p className="text-sm text-muted-foreground italic">"{personalMessage}"</p>
						</div>
					)}

					{/* Action buttons */}
					<div className="flex w-full gap-3">
						<Button
							data-testid="copy-link-button"
							variant="outline"
							className="flex-1 min-h-11"
							onClick={handleCopy}
						>
							{copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
							{copied ? "Copied!" : "Copy Link"}
						</Button>

						{canShare && (
							<Button data-testid="share-button" className="flex-1 min-h-11" onClick={handleShare}>
								<Share2 className="h-4 w-4 mr-2" />
								Share
							</Button>
						)}
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
