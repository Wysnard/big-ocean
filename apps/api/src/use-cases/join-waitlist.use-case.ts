/**
 * Join Waitlist Use Case (Story 15.3)
 *
 * Captures email for waitlist when global assessment limit is reached.
 */

import { WaitlistRepository } from "@workspace/domain";
import { Effect } from "effect";

export const joinWaitlist = (input: { email: string }) =>
	Effect.gen(function* () {
		const waitlistRepo = yield* WaitlistRepository;
		yield* waitlistRepo.addEmail(input.email);
		return { ok: true as const };
	});
