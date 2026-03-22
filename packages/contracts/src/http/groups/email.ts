/**
 * Email HTTP API Group (Story 31-7)
 *
 * Internal endpoint for triggering drop-off re-engagement email checks.
 * Intended to be called by a cron job or admin tooling.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError } from "../../errors";

/**
 * Email API Group
 *
 * Routes:
 * - POST /api/email/check-drop-off - Trigger drop-off email check
 */
export const EmailGroup = HttpApiGroup.make("email")
	.add(
		HttpApiEndpoint.post("checkDropOff", "/check-drop-off")
			.addSuccess(S.Struct({ emailsSent: S.Number }))
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("checkCheckIn", "/check-check-in")
			.addSuccess(S.Struct({ emailsSent: S.Number }))
			.addError(DatabaseError, { status: 500 }),
	)
	.prefix("/email");
