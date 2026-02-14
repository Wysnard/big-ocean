const SESSION_ROUTE_PATHS = new Set(["/chat", "/results"]);

function isSafeInternalPath(path: unknown): path is string {
	return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

/**
 * Resolve the active assessment session id from router location.
 * Supports:
 * - /chat?sessionId=...
 * - /results?sessionId=...
 * - /results/:sessionId
 */
export function getActiveAssessmentSessionId(
	pathname: string,
	search: Record<string, unknown>,
): string | undefined {
	const searchSessionId = search.sessionId;
	if (typeof searchSessionId === "string" && searchSessionId.length > 0) {
		return searchSessionId;
	}

	const resultsMatch = pathname.match(/^\/results\/([^/?#]+)/);
	if (resultsMatch?.[1]) {
		return decodeURIComponent(resultsMatch[1]);
	}

	return undefined;
}

/**
 * Build auth page href and preserve optional assessment context.
 */
export function buildAuthPageHref(
	pathname: "/login" | "/signup",
	options?: { sessionId?: string; redirectTo?: string },
): string {
	const url = new URL(pathname, "http://localhost");

	if (options?.sessionId) {
		url.searchParams.set("sessionId", options.sessionId);
	}

	if (isSafeInternalPath(options?.redirectTo)) {
		url.searchParams.set("redirectTo", options.redirectTo);
	}

	const query = url.searchParams.toString();
	return query ? `${url.pathname}?${query}` : url.pathname;
}

/**
 * Build post-auth redirect target.
 * If redirect path is /chat or /results and sessionId exists, ensure sessionId query is present.
 */
export function buildPostAuthRedirect(options?: {
	sessionId?: string;
	redirectTo?: string;
	fallback?: string;
}): string {
	const fallback = options?.fallback ?? "/dashboard";
	const redirectTo = isSafeInternalPath(options?.redirectTo) ? options?.redirectTo : fallback;
	const url = new URL(redirectTo, "http://localhost");

	if (
		options?.sessionId &&
		SESSION_ROUTE_PATHS.has(url.pathname) &&
		!url.searchParams.has("sessionId")
	) {
		url.searchParams.set("sessionId", options.sessionId);
	}

	const query = url.searchParams.toString();
	return query ? `${url.pathname}?${query}${url.hash}` : `${url.pathname}${url.hash}`;
}
