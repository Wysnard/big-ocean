/**
 * Mock: web-push.fetch.repository.ts (Story 10-2)
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/web-push.fetch.repository')
 */

import { WebPushRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

export const WebPushFetchRepositoryLive = Layer.succeed(
	WebPushRepository,
	WebPushRepository.of({
		sendNotification: () => Effect.void,
	}),
);
