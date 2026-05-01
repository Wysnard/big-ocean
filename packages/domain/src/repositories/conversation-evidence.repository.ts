/**
 * Conversation Evidence Repository Interface
 *
 * Pure data access layer for conversation_evidence table.
 * Evidence retry idempotency is exchange-scoped: the exchange is the prompt
 * whose answer produced the evidence.
 *
 * Story 10.1
 */
import { Context, Effect } from "effect";
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";
import { ConversationEvidenceError } from "../errors/http.errors";
import type {
	EvidenceConfidence,
	EvidenceInput,
	EvidencePolarity,
	EvidenceStrength,
} from "../types/evidence";

export { ConversationEvidenceError };

/** Input for saving conversation evidence — EvidenceInput (minus deviation) + FK context + required note + exchange link + polarity */
export type ConversationEvidenceInput = Omit<EvidenceInput, "deviation"> & {
	readonly sessionId: string;
	readonly messageId: string;
	readonly note: string;
	readonly exchangeId: string;
	readonly polarity: EvidencePolarity;
};

/** Full DB row returned from queries */
export interface ConversationEvidenceRecord {
	readonly id: string;
	readonly sessionId: string;
	readonly messageId: string;
	readonly exchangeId: string;
	readonly bigfiveFacet: FacetName;
	readonly deviation: number;
	readonly strength: EvidenceStrength;
	readonly confidence: EvidenceConfidence;
	readonly domain: LifeDomain;
	readonly polarity: EvidencePolarity;
	readonly note: string;
	readonly createdAt: Date;
}

export class ConversationEvidenceRepository extends Context.Tag("ConversationEvidenceRepository")<
	ConversationEvidenceRepository,
	{
		readonly save: (
			records: ConversationEvidenceInput[],
		) => Effect.Effect<void, ConversationEvidenceError>;
		readonly findBySession: (
			sessionId: string,
		) => Effect.Effect<ConversationEvidenceRecord[], ConversationEvidenceError>;
		readonly findByUserId: (
			userId: string,
		) => Effect.Effect<ConversationEvidenceRecord[], ConversationEvidenceError>;
		readonly hasEvidenceForExchange: (
			exchangeId: string,
		) => Effect.Effect<boolean, ConversationEvidenceError>;
	}
>() {}
