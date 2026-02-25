/**
 * Mock: waitlist.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/waitlist.drizzle.repository')
 *
 * In-memory waitlist implementation for testing.
 */
import { WaitlistRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const emails = new Set<string>();

/** Clear in-memory state between tests. */
export const _resetMockState = () => {
	emails.clear();
};

export const WaitlistDrizzleRepositoryLive = Layer.succeed(
	WaitlistRepository,
	WaitlistRepository.of({
		addEmail: (email: string) =>
			Effect.sync(() => {
				emails.add(email);
			}),
	}),
);
