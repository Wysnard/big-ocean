/**
 * Polar.sh Themed Checkout Embed
 *
 * Calls the Better Auth checkout endpoint to get a checkout URL,
 * then creates a PolarEmbedCheckout with the app's current theme.
 */
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import type { AppTheme } from "@workspace/ui/hooks/use-theme";
import { authClient } from "./auth-client";

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
) {
	const res = await authClient.checkout({
		slug,
		metadata,
		redirect: false,
		embedOrigin: window.location.origin,
	});
	if (res.error) {
		throw new Error(res.error.message ?? "Checkout creation failed");
	}
	return PolarEmbedCheckout.create(res.data.url, { theme });
}
