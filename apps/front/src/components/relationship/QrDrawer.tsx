/**
 * QR Drawer Component (Story 34-2)
 *
 * Bottom drawer that displays a QR code for relationship analysis initiation.
 * Uses vaul-based Drawer from @workspace/ui.
 * Renders QR code via qrcode.react, shows shareable URL, handles copy-to-clipboard.
 */

import { Button } from "@workspace/ui/components/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@workspace/ui/components/drawer";
import { Check, CheckCircle, Copy, Loader2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useState } from "react";
import { useQrDrawer } from "@/hooks/useQrDrawer";

interface QrDrawerContentProps {
	isLoading: boolean;
	token: string | null;
	shareUrl: string | null;
	status: string;
	error: string | null;
	onClose: () => void;
}

/**
 * Inner content of the QR drawer — exported for unit testing.
 * Does not use Drawer primitives so it can be tested in isolation.
 */
export function QrDrawerContent({
	isLoading,
	token,
	shareUrl,
	status,
	error,
	onClose,
}: QrDrawerContentProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API not available — fail silently
		}
	}, [shareUrl]);

	// Error state
	if (error) {
		return (
			<div data-testid="qr-drawer-error" className="p-6 text-center space-y-4">
				<div className="text-destructive text-sm">{error}</div>
				<Button variant="outline" onClick={onClose} className="min-h-11">
					Close
				</Button>
			</div>
		);
	}

	// Loading state
	if (isLoading || !token || !shareUrl) {
		return (
			<div data-testid="qr-drawer-loading" className="p-6 flex flex-col items-center gap-4">
				<div className="w-48 h-48 rounded-lg bg-muted motion-safe:animate-pulse" />
				<div className="w-full max-w-xs h-10 rounded-md bg-muted motion-safe:animate-pulse" />
				<Loader2 className="h-5 w-5 text-muted-foreground motion-safe:animate-spin" />
			</div>
		);
	}

	// Accepted state
	if (status === "accepted") {
		return (
			<div
				data-testid="qr-drawer-accepted"
				className="p-6 flex flex-col items-center gap-4 text-center"
			>
				<CheckCircle className="h-12 w-12 text-green-500" />
				<div className="space-y-1">
					<p className="text-lg font-semibold text-foreground">Invitation Accepted</p>
					<p className="text-sm text-muted-foreground">
						Your relationship analysis is being generated. You'll be notified when it's ready.
					</p>
				</div>
				<Button onClick={onClose} className="min-h-11 w-full max-w-xs">
					Got it
				</Button>
			</div>
		);
	}

	// Ready state — show QR code and share URL
	return (
		<div className="p-6 flex flex-col items-center gap-5">
			<div className="text-center space-y-1">
				<h2 className="text-foreground font-semibold text-lg">Invite Someone</h2>
				<p className="text-muted-foreground text-sm">
					Share this QR code or link to invite someone to discover your dynamic together.
				</p>
			</div>

			{/* QR Code */}
			<div
				data-testid="qr-drawer-code"
				className="bg-white p-4 rounded-xl shadow-sm border border-border"
			>
				<QRCodeSVG
					value={shareUrl}
					size={192}
					level="M"
					marginSize={0}
					aria-label="QR code for relationship analysis invitation"
				/>
			</div>

			{/* Share URL */}
			<div className="w-full max-w-sm space-y-2">
				<div
					data-testid="qr-drawer-share-url"
					className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2"
				>
					<span className="text-xs text-muted-foreground truncate flex-1 select-all">{shareUrl}</span>
				</div>
				<Button
					data-testid="qr-drawer-copy-button"
					variant="outline"
					className="w-full min-h-11"
					onClick={handleCopy}
				>
					{copied ? (
						<>
							<Check className="h-4 w-4 mr-2" />
							Copied
						</>
					) : (
						<>
							<Copy className="h-4 w-4 mr-2" />
							Copy Link
						</>
					)}
				</Button>
			</div>

			{/* Status indicator */}
			{status === "expired" && (
				<p className="text-xs text-muted-foreground text-center">
					This QR code has expired. Close and reopen to generate a new one.
				</p>
			)}
		</div>
	);
}

/**
 * QR Drawer — full drawer component with trigger integration.
 * Uses the useQrDrawer hook for lifecycle management.
 */
export function QrDrawerWithTrigger() {
	const drawer = useQrDrawer();

	return (
		<>
			<Button
				data-testid="qr-drawer-trigger"
				variant="default"
				className="w-full min-h-11"
				onClick={drawer.open}
			>
				<QrCode className="h-4 w-4 mr-2" />
				Invite Someone
			</Button>

			<Drawer
				open={drawer.isOpen}
				onOpenChange={(open) => {
					if (!open) drawer.close();
				}}
			>
				<DrawerContent>
					<DrawerHeader className="sr-only">
						<DrawerTitle>Invite Someone</DrawerTitle>
						<DrawerDescription>
							Share a QR code to invite someone for a relationship analysis
						</DrawerDescription>
					</DrawerHeader>
					<QrDrawerContent
						isLoading={drawer.isLoading}
						token={drawer.token}
						shareUrl={drawer.shareUrl}
						status={drawer.status}
						error={drawer.error}
						onClose={drawer.close}
					/>
				</DrawerContent>
			</Drawer>
		</>
	);
}
