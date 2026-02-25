/**
 * Waitlist Handler (Story 15.3)
 *
 * Thin HTTP adapter for waitlist email capture.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { Effect } from "effect";
import { joinWaitlist } from "../use-cases/join-waitlist.use-case";

export const WaitlistGroupLive = HttpApiBuilder.group(BigOceanApi, "waitlist", (handlers) =>
	Effect.gen(function* () {
		return handlers.handle("joinWaitlist", ({ payload }) => joinWaitlist(payload));
	}),
);
