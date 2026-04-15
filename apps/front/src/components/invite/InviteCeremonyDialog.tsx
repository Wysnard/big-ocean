import { useForm } from "@tanstack/react-form";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Copy, QrCode, Share2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QrDrawerContent } from "@/components/relationship/QrDrawer";
import { useInviteCeremonyQrToken } from "@/hooks/useInviteCeremonyQrToken";
import {
	INVITE_CEREMONY_BODY_PARAGRAPHS,
	INVITE_CEREMONY_COPY_LINK,
	INVITE_CEREMONY_DIALOG_DESCRIPTION,
	INVITE_CEREMONY_DIVIDER,
	INVITE_CEREMONY_HEADING,
	INVITE_CEREMONY_NAME_PLACEHOLDER,
	INVITE_CEREMONY_NAME_PROMPT,
	INVITE_CEREMONY_SHARE_NATIVE,
	INVITE_CEREMONY_SHARE_QR,
	INVITE_CEREMONY_SHARE_TEXT,
	INVITE_CEREMONY_THEIR_SIDE,
} from "./invite-ceremony-copy";

type QrSession = ReturnType<typeof useInviteCeremonyQrToken>;

export interface InviteCeremonyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	presetName?: string;
}

function InviteCeremonyDialogBody({
	presetName,
	qrSession,
	showQr,
	setShowQr,
}: {
	presetName?: string;
	qrSession: QrSession;
	showQr: boolean;
	setShowQr: (show: boolean) => void;
}) {
	const form = useForm({
		defaultValues: {
			theirName: presetName ?? "",
		},
		onSubmit: async () => {
			// Optional name is ceremony-only in Story 6.2 — not persisted server-side.
		},
	});

	const copyShareUrl = useCallback(async () => {
		const url = qrSession.shareUrl;
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			toast.success("Link copied");
		} catch {
			toast.error("Could not copy link");
		}
	}, [qrSession.shareUrl]);

	const shareNative = useCallback(async () => {
		const url = qrSession.shareUrl;
		if (!url) return;
		if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
			try {
				await navigator.share({
					title: INVITE_CEREMONY_HEADING,
					text: INVITE_CEREMONY_SHARE_TEXT,
					url,
				});
				return;
			} catch (e) {
				const err = e as { name?: string };
				if (err?.name === "AbortError") return;
				// Non-abort failure (e.g. permission denied) — fall through to link copy
				toast.info("Share unavailable — copying link instead");
			}
		}
		await copyShareUrl();
	}, [copyShareUrl, qrSession.shareUrl]);

	if (showQr) {
		return (
			<div className="p-0">
				<div className="flex items-center gap-2 border-b border-border px-4 py-3">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="min-h-9 text-muted-foreground"
						onClick={() => setShowQr(false)}
					>
						← Back
					</Button>
				</div>
				<QrDrawerContent
					isLoading={qrSession.isLoading}
					token={qrSession.token}
					shareUrl={qrSession.shareUrl}
					status={qrSession.status}
					error={qrSession.error}
					onClose={() => setShowQr(false)}
					onRetry={qrSession.retry}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-5 p-6 sm:p-8">
			<DialogHeader className="space-y-3 text-left">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					Big Ocean
				</p>
				<DialogTitle
					className="font-heading text-xl leading-tight text-foreground sm:text-2xl"
					id="invite-ceremony-dialog-title"
				>
					{INVITE_CEREMONY_HEADING}
				</DialogTitle>
				<p id="invite-ceremony-dialog-desc" className="sr-only">
					{INVITE_CEREMONY_DIALOG_DESCRIPTION}
				</p>
			</DialogHeader>

			<div
				className="space-y-4 text-base leading-7 text-muted-foreground"
				data-testid="invite-ceremony-copy"
			>
				{INVITE_CEREMONY_BODY_PARAGRAPHS.map((paragraph) => (
					<p key={paragraph}>{paragraph}</p>
				))}
				<p className="text-center text-sm tracking-widest text-muted-foreground/80">
					{INVITE_CEREMONY_DIVIDER}
				</p>
				{INVITE_CEREMONY_THEIR_SIDE.map((paragraph) => (
					<p key={paragraph}>{paragraph}</p>
				))}
			</div>

			<form
				className="space-y-2"
				onSubmit={(e) => {
					e.preventDefault();
					void form.handleSubmit();
				}}
			>
				<form.Field name="theirName">
					{(field) => (
						<Field>
							<FieldLabel htmlFor="invite-ceremony-their-name" className="text-foreground">
								{INVITE_CEREMONY_NAME_PROMPT}
							</FieldLabel>
							<Input
								id="invite-ceremony-their-name"
								data-testid="invite-ceremony-name-input"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder={INVITE_CEREMONY_NAME_PLACEHOLDER}
								autoComplete="off"
							/>
						</Field>
					)}
				</form.Field>
			</form>

			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				<Button
					type="button"
					variant="default"
					data-testid="invite-ceremony-qr-button"
					className="min-h-11 flex-1"
					disabled={qrSession.isLoading || !!qrSession.error || !qrSession.shareUrl}
					onClick={() => setShowQr(true)}
				>
					<QrCode className="mr-2 size-4" aria-hidden="true" />
					{INVITE_CEREMONY_SHARE_QR}
				</Button>
				<Button
					type="button"
					variant="secondary"
					data-testid="invite-ceremony-copy-link-button"
					className="min-h-11 flex-1"
					disabled={qrSession.isLoading || !!qrSession.error || !qrSession.shareUrl}
					onClick={() => {
						void copyShareUrl();
					}}
				>
					<Copy className="mr-2 size-4" aria-hidden="true" />
					{INVITE_CEREMONY_COPY_LINK}
				</Button>
				<Button
					type="button"
					variant="outline"
					data-testid="invite-ceremony-native-share-button"
					className="min-h-11 flex-1"
					disabled={qrSession.isLoading || !!qrSession.error || !qrSession.shareUrl}
					onClick={() => {
						void shareNative();
					}}
				>
					<Share2 className="mr-2 size-4" aria-hidden="true" />
					{INVITE_CEREMONY_SHARE_NATIVE}
				</Button>
			</div>

			{qrSession.error ? (
				<div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
					<p>{qrSession.error}</p>
					<Button type="button" variant="outline" className="mt-3 min-h-11" onClick={qrSession.retry}>
						Try again
					</Button>
				</div>
			) : null}
		</div>
	);
}

export function InviteCeremonyDialog({
	open,
	onOpenChange,
	presetName,
}: InviteCeremonyDialogProps) {
	const qrSession = useInviteCeremonyQrToken(open);
	const qrRef = useRef(qrSession);
	qrRef.current = qrSession;

	const [showQr, setShowQr] = useState(false);

	useEffect(() => {
		if (open) {
			qrRef.current.startSession();
		} else {
			qrRef.current.resetSession();
		}
	}, [open]);

	useEffect(() => {
		if (!open) {
			setShowQr(false);
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				data-testid="invite-ceremony-dialog"
				className="max-h-[min(90dvh,40rem)] gap-0 overflow-y-auto p-0 sm:max-w-lg"
				aria-labelledby="invite-ceremony-dialog-title"
				aria-describedby="invite-ceremony-dialog-desc"
			>
				{open ? (
					<InviteCeremonyDialogBody
						key={presetName ?? "__default__"}
						presetName={presetName}
						qrSession={qrSession}
						showQr={showQr}
						setShowQr={setShowQr}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
