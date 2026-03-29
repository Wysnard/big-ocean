/**
 * Mock: assessment-exchange.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/assessment-exchange.drizzle.repository')
 *
 * Story 23-3: Exchange Table & Schema Migration
 */
import { AssessmentExchangeRepository } from "@workspace/domain";
import type {
	AssessmentExchangeRecord,
	AssessmentExchangeUpdateInput,
} from "@workspace/domain/repositories/assessment-exchange.repository";
import { Effect, Layer } from "effect";

const exchanges = new Map<string, AssessmentExchangeRecord[]>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => exchanges.clear();

export const AssessmentExchangeDrizzleRepositoryLive = Layer.succeed(
	AssessmentExchangeRepository,
	AssessmentExchangeRepository.of({
		create: (sessionId: string, turnNumber: number) =>
			Effect.sync(() => {
				const id = crypto.randomUUID();
				const exchange: AssessmentExchangeRecord = {
					id,
					sessionId,
					turnNumber,
					energy: null,
					energyBand: null,
					telling: null,
					tellingBand: null,
					withinMessageShift: null,
					stateNotes: null,
					extractionTier: null,
					smoothedEnergy: null,
					sessionTrust: null,
					drain: null,
					trustCap: null,
					eTarget: null,
					scorerOutput: null,
					selectedTerritory: null,
					selectionRule: null,
					governorOutput: null,
					governorDebug: null,
					sessionPhase: null,
					transitionType: null,
					createdAt: new Date(),
				};
				const existing = exchanges.get(sessionId) || [];
				existing.push(exchange);
				exchanges.set(sessionId, existing);
				return exchange;
			}),

		update: (exchangeId: string, data: AssessmentExchangeUpdateInput) =>
			Effect.sync(() => {
				for (const [, sessionExchanges] of exchanges) {
					const idx = sessionExchanges.findIndex((e) => e.id === exchangeId);
					if (idx !== -1) {
						const existing = sessionExchanges[idx];
						if (existing) {
							const updated: AssessmentExchangeRecord = {
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
				const all: AssessmentExchangeRecord[] = [];
				for (const [, sessionExchanges] of exchanges) {
					all.push(...sessionExchanges);
				}
				return all.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
			}),
	}),
);
