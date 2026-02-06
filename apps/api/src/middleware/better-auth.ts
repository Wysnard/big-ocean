/**
 * Better Auth HTTP Adapter
 *
 * Uses Better Auth's built-in toNodeHandler for proper node:http ↔ Fetch API conversion.
 * Adds CORS headers and OPTIONS handling around the auth handler.
 *
 * IMPORTANT: Only reads request body for auth routes (/api/auth/*) to avoid
 * consuming the body before Effect handler can process non-auth routes.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { toNodeHandler } from "better-auth/node";

/**
 * Check if request is for Better Auth routes
 */
function isBetterAuthRoute(url: string | undefined): boolean {
	if (!url) return false;
	return url.startsWith("/api/auth");
}

/**
 * Add CORS headers to a ServerResponse
 */
function addCorsHeaders(res: ServerResponse, frontendUrl: string): void {
	res.setHeader("Access-Control-Allow-Origin", frontendUrl);
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Max-Age", "86400");
}

/**
 * Create Better Auth handler for node:http integration
 *
 * Only processes /api/auth/* routes - other routes pass through without
 * consuming the request body.
 */
export function createBetterAuthHandler(
	auth: { handler: (request: Request) => Promise<Response> },
	_betterAuthUrl: string,
	frontendUrl: string,
) {
	const nodeHandler = toNodeHandler(auth);

	return async function betterAuthHandler(
		incomingMessage: IncomingMessage,
		serverResponse: ServerResponse,
	): Promise<void> {
		// Add CORS headers to ALL responses (auth and non-auth)
		addCorsHeaders(serverResponse, frontendUrl);

		// Handle OPTIONS preflight requests immediately
		if (incomingMessage.method === "OPTIONS") {
			serverResponse.statusCode = 204;
			serverResponse.end();
			return;
		}

		// Only handle auth routes - let other routes pass through
		if (!isBetterAuthRoute(incomingMessage.url)) {
			// CORS headers already set, don't consume body, let Effect handle it
			return;
		}

		// Delegate to Better Auth's built-in node handler for proper request conversion
		await nodeHandler(incomingMessage, serverResponse);
	};
}
