/**
 * Mock: logger.pino.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/logger.pino.repository')
 */
import { LoggerRepository } from "@workspace/domain";
import { Layer } from "effect";

export const LoggerPinoRepositoryLive = Layer.succeed(
	LoggerRepository,
	LoggerRepository.of({
		info: () => {},
		warn: () => {},
		error: () => {},
		debug: () => {},
	}),
);
