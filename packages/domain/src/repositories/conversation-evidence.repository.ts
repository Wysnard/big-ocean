/**
 * Conversation Evidence Repository Interface
 *
 * Pure data access layer for conversation_evidence table.
 * No cap enforcement — caller responsibility (3-record cap enforced by use-case).
 *
 * Story 10.1
 */
import { Context, Effect } from "effect";
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";
import { ConversationEvidenceError } from "../errors/http.errors";
import type { EvidenceConfidence, EvidenceInput, EvidenceStrength } from "../types/evidence";

export { ConversationEvidenceError };

/** Input for saving conversation evidence — EvidenceInput + FK context + required note + exchange link */
export type ConversationEvidenceInput = EvidenceInput & {
	readonly sessionId: string;
	readonly messageId: string;
	readonly note: string;
	readonly exchangeId: string;
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
		readonly countByMessage: (messageId: string) => Effect.Effect<number, ConversationEvidenceError>;
	}
>() {}
