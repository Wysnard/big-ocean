/**
 * Email HTTP API Group (Story 31-7, Story 38-1, Story 38-2)
 *
 * Internal endpoints for triggering email checks.
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
 * - POST /api/email/check-check-in - Trigger check-in email check
 * - POST /api/email/check-recapture - Trigger portrait recapture email check
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
	.add(
		HttpApiEndpoint.post("checkRecapture", "/check-recapture")
			.addSuccess(S.Struct({ emailsSent: S.Number }))
			.addError(DatabaseError, { status: 500 }),
	)
	.prefix("/email");
