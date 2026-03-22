/**
 * Share Flow Hook (Story 33-3)
 *
 * Encapsulates the share flow logic:
 * - If profile is public: share/copy immediately
 * - If profile is private: prompt to make public first
 * - Web Share API with clipboard fallback
 */

import { useCallback, useState } from "react";

interface ShareState {
	publicProfileId: string;
	shareableUrl: string;
	isPublic: boolean;
}

interface UseShareFlowOptions {
	shareState: ShareState | null;
	archetypeName: string;
	toggleVisibility: (input: {
		publicProfileId: string;
		isPublic: boolean;
	}) => Promise<{ isPublic: boolean }>;
	onShareStateChange: (update: { isPublic: boolean }) => void;
}

interface UseShareFlowReturn {
	initiateShare: () => Promise<void>;
	acceptAndShare: () => Promise<void>;
	declineShare: () => void;
	promptNeeded: boolean;
	copied: boolean;
	isToggling: boolean;
}

/** Detect Web Share API availability */
function canUseWebShare(): boolean {
	return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

async function triggerShare(shareableUrl: string, archetypeName: string): Promise<boolean> {
	if (canUseWebShare()) {
		try {
			await navigator.share({
				title: `My personality archetype: ${archetypeName}`,
				text: "Check out my Big Ocean personality profile",
				url: shareableUrl,
			});
			return true;
		} catch {
			// User cancelled or share failed — fall through to clipboard
		}
	}
	return false;
}

async function copyToClipboard(url: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(url);
	} catch {
		// Fallback for older browsers
		const textarea = document.createElement("textarea");
		textarea.value = url;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand("copy");
		document.body.removeChild(textarea);
	}
}

export function useShareFlow({
	shareState,
	archetypeName,
	toggleVisibility,
	onShareStateChange,
}: UseShareFlowOptions): UseShareFlowReturn {
	const [promptNeeded, setPromptNeeded] = useState(false);
	const [copied, setCopied] = useState(false);
	const [isToggling, setIsToggling] = useState(false);

	const performShare = useCallback(
		async (url: string) => {
			const shared = await triggerShare(url, archetypeName);
			if (!shared) {
				await copyToClipboard(url);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}
		},
		[archetypeName],
	);

	const initiateShare = useCallback(async () => {
		if (!shareState) return;

		if (shareState.isPublic) {
			await performShare(shareState.shareableUrl);
		} else {
			setPromptNeeded(true);
		}
	}, [shareState, performShare]);

	const acceptAndShare = useCallback(async () => {
		if (!shareState) return;

		setIsToggling(true);
		try {
			const result = await toggleVisibility({
				publicProfileId: shareState.publicProfileId,
				isPublic: true,
			});
			onShareStateChange({ isPublic: result.isPublic });
			setPromptNeeded(false);
			await performShare(shareState.shareableUrl);
		} catch {
			// Toggle failed — keep prompt open for retry
		} finally {
			setIsToggling(false);
		}
	}, [shareState, toggleVisibility, onShareStateChange, performShare]);

	const declineShare = useCallback(() => {
		setPromptNeeded(false);
	}, []);

	return {
		initiateShare,
		acceptAndShare,
		declineShare,
		promptNeeded,
		copied,
		isToggling,
	};
}
