/**
 * Invite Token Security (Story 14.3)
 *
 * HttpApiSecurity.apiKey definition for the invite_token cookie.
 * Used to persist the invitation token through signup/login flow.
 */
import { HttpApiSecurity } from "@effect/platform";

export const InviteTokenSecurity = HttpApiSecurity.apiKey({
	in: "cookie",
	key: "invite_token",
});
