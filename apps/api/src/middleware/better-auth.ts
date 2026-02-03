/**
 * Better Auth HTTP Adapter
 *
 * Converts Node.js IncomingMessage/ServerResponse to Fetch API Request/Response
 * Pattern from: https://dev.to/danimydev/authentication-with-nodehttp-and-better-auth-2l2g
 *
 * IMPORTANT: Only reads request body for auth routes (/api/auth/*) to avoid
 * consuming the body before Effect handler can process non-auth routes.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Auth, BetterAuthOptions } from "better-auth";

/**
 * Check if request is for Better Auth routes
 */
function isBetterAuthRoute(url: string | undefined): boolean {
	if (!url) return false;
	return url.startsWith("/api/auth");
}

/**
 * Convert Node.js IncomingMessage to Fetch API Request
 * Only reads body for auth routes to avoid consuming stream for other routes
 */
async function incomingMessageToRequest(
	incomingMessage: IncomingMessage,
	baseUrl: URL,
	shouldReadBody: boolean,
): Promise<Request> {
	const method = incomingMessage.method || "GET";
	const url = new URL(incomingMessage.url || "/", baseUrl);

	const headers = new Headers();
	for (const [key, value] of Object.entries(incomingMessage.headers)) {
		if (value) {
			headers.set(key, Array.isArray(value) ? value.join(", ") : value);
		}
	}

	// Only read body for auth routes (POST/PUT methods)
	let body: BodyInit | null = null;
	if (shouldReadBody && method !== "GET" && method !== "HEAD") {
		const chunks: Buffer[] = [];
		for await (const chunk of incomingMessage) {
			// Handle both Buffer and string chunks
			if (typeof chunk === "string") {
				chunks.push(Buffer.from(chunk));
			} else {
				chunks.push(chunk);
			}
		}
		body = Buffer.concat(chunks);
	}

	return new Request(url.toString(), { method, headers, body });
}

/**
 * Create Better Auth handler for node:http integration
 *
 * Only processes /api/auth/* routes - other routes pass through without
 * consuming the request body.
 */
export function createBetterAuthHandler(auth: Auth<BetterAuthOptions>, betterAuthUrl: string) {
	return async function betterAuthHandler(
		incomingMessage: IncomingMessage,
		serverResponse: ServerResponse,
	): Promise<void> {
		// Only handle auth routes - let other routes pass through
		if (!isBetterAuthRoute(incomingMessage.url)) {
			// Don't consume body, don't set response - let Effect handle it
			return;
		}

		const baseUrl = new URL(betterAuthUrl);
		const request = await incomingMessageToRequest(incomingMessage, baseUrl, true);

		const response = await auth.handler(request);

		serverResponse.statusCode = response.status;

		response.headers.forEach((value, key) => {
			serverResponse.setHeader(key, value);
		});

		if (response.body) {
			const reader = response.body.getReader();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				serverResponse.write(value);
			}
		}

		serverResponse.end();
	};
}
