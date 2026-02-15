/**
 * Playwright API Client — wraps `request.newContext()` for E2E API calls.
 *
 * All factories and setup code use this instead of raw `fetch`.
 * Cookies are automatically managed by the Playwright request context.
 */

import { type APIRequestContext, request } from "@playwright/test";
import { API_URL } from "../e2e-env.js";

/**
 * Create a new Playwright API request context pointed at the test API.
 * Caller is responsible for calling `dispose()` when done.
 */
export async function createApiContext(): Promise<APIRequestContext> {
	return request.newContext({ baseURL: API_URL });
}
