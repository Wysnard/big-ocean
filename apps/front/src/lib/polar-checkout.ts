/**
 * Polar.sh Themed Checkout Embed
 *
 * Calls the Better Auth checkout endpoint to get a checkout URL,
 * then creates a PolarEmbedCheckout with the app's current theme.
 */
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import type { AppTheme } from "@workspace/ui/hooks/use-theme";
import { authClient } from "./auth-client";

/** Checkout slug for €9.99/mo subscription (maps to `polarProductSubscription` on the server). */
export const POLAR_CHECKOUT_SLUG_SUBSCRIPTION = "subscription" as const;

export type CheckoutEmbedLifecycleCallbacks = {
	readonly onClose?: () => void;
	readonly onSuccess?: () => void;
};

/**
 * Creates a Polar embedded checkout overlay with the given theme.
 *
 * We call the server endpoint manually (instead of authClient.checkoutEmbed)
 * so we can pass the resolved app theme to the embed overlay.
 */
export async function createThemedCheckoutEmbed(
	slug: string,
	theme: AppTheme,
	metadata?: Record<string, string>,
	lifecycle?: CheckoutEmbedLifecycleCallbacks,
) {
	const res = await authClient.checkout({
		slug,
		metadata,
		redirect: false,
		embedOrigin: typeof window !== "undefined" ? window.location.origin : "",
	});
	if (res.error) {
		throw new Error(res.error.message ?? "Checkout creation failed");
	}
	const embed = await PolarEmbedCheckout.create(res.data.url, { theme });
	if (lifecycle?.onSuccess) {
		embed.addEventListener("success", () => {
			lifecycle.onSuccess?.();
		});
	}
	if (lifecycle?.onClose) {
		embed.addEventListener("close", () => {
			lifecycle.onClose?.();
		});
	}
	return embed;
}
