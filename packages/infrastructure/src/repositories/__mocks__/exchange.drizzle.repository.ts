/**
 * Mock: exchange.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/exchange.drizzle.repository')
 *
 * Story 43-1: Updated for Director model schema (director_output, coverage_targets).
 */
import { ExchangeRepository } from "@workspace/domain";
import type {
	ExchangeRecord,
	ExchangeUpdateInput,
} from "@workspace/domain/repositories/exchange.repository";
import { Effect, Layer } from "effect";

const exchanges = new Map<string, ExchangeRecord[]>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => exchanges.clear();

export const ExchangeDrizzleRepositoryLive = Layer.succeed(
	ExchangeRepository,
	ExchangeRepository.of({
		create: (sessionId: string, turnNumber: number) =>
			Effect.sync(() => {
				const id = crypto.randomUUID();
				const exchange: ExchangeRecord = {
					id,
					sessionId,
					turnNumber,
					extractionTier: null,
					directorOutput: null,
					coverageTargets: null,
					createdAt: new Date(),
				};
				const existing = exchanges.get(sessionId) || [];
				existing.push(exchange);
				exchanges.set(sessionId, existing);
				return exchange;
			}),

		update: (exchangeId: string, data: ExchangeUpdateInput) =>
			Effect.sync(() => {
				for (const [, sessionExchanges] of exchanges) {
					const idx = sessionExchanges.findIndex((e) => e.id === exchangeId);
					if (idx !== -1) {
						const existing = sessionExchanges[idx];
						if (existing) {
							const updated: ExchangeRecord = {
								...existing,
								...data,
							};
							sessionExchanges[idx] = updated;
							return updated;
						}
					}
				}
				// Should not happen in well-structured tests
				throw new Error(`Exchange not found: ${exchangeId}`);
			}),

		findBySession: (sessionId: string) =>
			Effect.sync(() => {
				const sessionExchanges = exchanges.get(sessionId) || [];
				return [...sessionExchanges].sort((a, b) => a.turnNumber - b.turnNumber);
			}),

		findByUserId: (_userId: string) =>
			Effect.sync(() => {
				const all: ExchangeRecord[] = [];
				for (const [, sessionExchanges] of exchanges) {
					all.push(...sessionExchanges);
				}
				return all.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
			}),
	}),
);
