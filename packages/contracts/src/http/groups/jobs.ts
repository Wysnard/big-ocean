/**
 * Internal / cron HTTP API group (Story 5.1)
 *
 * Intended for Railway cron or ops tooling — not for browser clients.
 * Optional `CRON_SECRET` + `x-cron-secret` header enforced in the use-case when configured.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { AssessmentResultError } from "@workspace/domain";
import { Schema as S } from "effect";
import { DatabaseError, Unauthorized } from "../../errors";

const WeekIdString = S.String.pipe(S.pattern(/^\d{4}-W\d{2}$/));

export const GenerateWeeklySummariesPayloadSchema = S.Struct({
	weekId: WeekIdString,
});

export const GenerateWeeklySummariesResponseSchema = S.Struct({
	processed: S.Number,
	skipped: S.Number,
	failed: S.Number,
});

export const JobsGroup = HttpApiGroup.make("jobs")
	.add(
		HttpApiEndpoint.post("generateWeeklySummaries", "/weekly-summaries/generate")
			.setPayload(GenerateWeeklySummariesPayloadSchema)
			.addSuccess(GenerateWeeklySummariesResponseSchema)
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 })
			.addError(AssessmentResultError, { status: 500 }),
	)
	.prefix("/jobs");

export type GenerateWeeklySummariesPayload = typeof GenerateWeeklySummariesPayloadSchema.Type;
export type GenerateWeeklySummariesResponse = typeof GenerateWeeklySummariesResponseSchema.Type;
