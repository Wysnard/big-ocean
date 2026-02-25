/**
 * Waitlist HTTP API Group (Story 15.3)
 *
 * Public endpoint for waitlist email capture when circuit breaker is active.
 * No authentication required — anonymous users can submit their email.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError } from "../../errors";

/**
 * Waitlist API Group
 *
 * Routes:
 * - POST /api/waitlist/signup - Submit email to waitlist
 */
export const WaitlistGroup = HttpApiGroup.make("waitlist")
	.add(
		HttpApiEndpoint.post("joinWaitlist", "/signup")
			.setPayload(
				S.Struct({
					email: S.String.pipe(S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
				}),
			)
			.addSuccess(S.Struct({ ok: S.Literal(true) }))
			.addError(DatabaseError, { status: 500 }),
	)
	.prefix("/waitlist");
