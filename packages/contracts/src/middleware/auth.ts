/**
 * Auth Middleware Contracts
 *
 * Two middleware variants:
 * - AuthMiddleware (strict): Fails with Unauthorized when no session. Provides `AuthenticatedUser` (string).
 * - OptionalAuthMiddleware: Always succeeds. Provides `CurrentUser` (string | undefined).
 *
 * Contract definitions only — implementations are in @workspace/api.
 *
 * @see https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#middlewares
 */
import { HttpApiMiddleware, HttpApiSecurity } from "@effect/platform";
import { AuthenticatedUser, CurrentUser, Unauthorized } from "@workspace/domain";

const sessionCookieSecurity = {
	sessionCookie: HttpApiSecurity.apiKey({
		in: "cookie",
		key: "better-auth.session_token",
	}),
} as const;

export class AuthMiddleware extends HttpApiMiddleware.Tag<AuthMiddleware>()("AuthMiddleware", {
	provides: AuthenticatedUser,
	failure: Unauthorized,
	security: sessionCookieSecurity,
}) {}

export class OptionalAuthMiddleware extends HttpApiMiddleware.Tag<OptionalAuthMiddleware>()(
	"OptionalAuthMiddleware",
	{
		provides: CurrentUser,
		security: sessionCookieSecurity,
	},
) {}
