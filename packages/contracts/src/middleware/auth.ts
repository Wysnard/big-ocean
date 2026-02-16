/**
 * AuthMiddleware - Effect/Platform HTTP API Middleware Tag
 *
 * Defines a non-optional middleware that extracts the authenticated user ID
 * from the Better Auth session cookie. Always succeeds — provides
 * `string | undefined` via `CurrentUser` Context.Tag.
 *
 * Contract definition only — implementation is `AuthMiddlewareLive` in @workspace/api.
 *
 * @see https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#middlewares
 */
import { HttpApiMiddleware, HttpApiSecurity } from "@effect/platform";
import { CurrentUser } from "@workspace/domain";

export class AuthMiddleware extends HttpApiMiddleware.Tag<AuthMiddleware>()("AuthMiddleware", {
	provides: CurrentUser,
	security: {
		sessionCookie: HttpApiSecurity.apiKey({
			in: "cookie",
			key: "better-auth.session_token",
		}),
	},
}) {}
