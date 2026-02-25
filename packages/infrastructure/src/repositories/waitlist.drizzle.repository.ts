/**
 * Waitlist Repository Implementation using Drizzle (Story 15.3)
 *
 * Simple email capture with ON CONFLICT DO NOTHING for duplicate handling.
 */

import { LoggerRepository, WaitlistRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { waitlistEmails } from "../db/drizzle/schema";

/**
 * Waitlist Drizzle Repository Layer
 */
export const WaitlistDrizzleRepositoryLive = Layer.effect(
	WaitlistRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return WaitlistRepository.of({
			addEmail: (email: string) =>
				Effect.gen(function* () {
					yield* db
						.insert(waitlistEmails)
						.values({ email })
						.onConflictDoNothing({ target: waitlistEmails.email });

					logger.info("Waitlist email captured", { email });
				}),
		});
	}),
);
