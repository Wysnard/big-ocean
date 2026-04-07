/**
 * Conversation Token Security
 *
 * HttpApiSecurity.apiKey definition for the anonymous session cookie.
 * Used with HttpApiBuilder.securitySetCookie (to set) and
 * HttpApiBuilder.securityDecode (to read) in handlers.
 *
 * Not a middleware — just a security scheme instance for cookie operations.
 */
import { HttpApiSecurity } from "@effect/platform";

export const ConversationTokenSecurity = HttpApiSecurity.apiKey({
	in: "cookie",
	key: "conversation_token",
});
