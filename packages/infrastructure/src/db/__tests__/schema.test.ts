import { ALL_FACETS } from "@workspace/domain/constants/big-five";
import { LIFE_DOMAINS } from "@workspace/domain/constants/life-domain";
import { describe, expect, it } from "vitest";
import {
	assessmentMessage,
	assessmentResults,
	assessmentSession,
	bigfiveFacetNameEnum,
	conversationEvidence,
	evidenceDomainEnum,
	finalizationEvidence,
	publicProfile,
} from "../drizzle/schema";

/**
 * Schema validation tests for two-tier architecture tables (Story 9.1)
 *
 * Verify table structure matches architecture spec before migration.
 */
describe("pgEnum values match domain constants", () => {
	it("evidence_domain enum should have values from LIFE_DOMAINS", () => {
		expect(evidenceDomainEnum.enumValues).toEqual([...LIFE_DOMAINS]);
	});

	it("bigfive_facet_name enum should have values from ALL_FACETS", () => {
		expect(bigfiveFacetNameEnum.enumValues).toEqual([...ALL_FACETS]);
	});

	it("evidence_domain should have exactly 6 values", () => {
		expect(evidenceDomainEnum.enumValues).toHaveLength(6);
	});

	it("bigfive_facet_name should have exactly 30 values", () => {
		expect(bigfiveFacetNameEnum.enumValues).toHaveLength(30);
	});
});

describe("Assessment Session Schema", () => {
	it("should have all required columns", () => {
		expect(assessmentSession.id).toBeDefined();
		expect(assessmentSession.userId).toBeDefined();
		expect(assessmentSession.sessionToken).toBeDefined();
		expect(assessmentSession.status).toBeDefined();
		expect(assessmentSession.finalizationProgress).toBeDefined();
		expect(assessmentSession.messageCount).toBeDefined();
		expect(assessmentSession.personalDescription).toBeDefined();
		expect(assessmentSession.createdAt).toBeDefined();
		expect(assessmentSession.updatedAt).toBeDefined();
	});
});

describe("Assessment Message Schema", () => {
	it("should have steering target columns", () => {
		expect(assessmentMessage.targetDomain).toBeDefined();
		expect(assessmentMessage.targetBigfiveFacet).toBeDefined();
	});

	it("should have core message columns", () => {
		expect(assessmentMessage.id).toBeDefined();
		expect(assessmentMessage.sessionId).toBeDefined();
		expect(assessmentMessage.role).toBeDefined();
		expect(assessmentMessage.content).toBeDefined();
		expect(assessmentMessage.createdAt).toBeDefined();
	});
});

describe("Conversation Evidence Schema", () => {
	it("should have all required columns", () => {
		expect(conversationEvidence.id).toBeDefined();
		expect(conversationEvidence.assessmentSessionId).toBeDefined();
		expect(conversationEvidence.assessmentMessageId).toBeDefined();
		expect(conversationEvidence.bigfiveFacet).toBeDefined();
		expect(conversationEvidence.score).toBeDefined();
		expect(conversationEvidence.confidence).toBeDefined();
		expect(conversationEvidence.domain).toBeDefined();
		expect(conversationEvidence.createdAt).toBeDefined();
	});
});

describe("Finalization Evidence Schema", () => {
	it("should have all required columns including quotes", () => {
		expect(finalizationEvidence.id).toBeDefined();
		expect(finalizationEvidence.assessmentMessageId).toBeDefined();
		expect(finalizationEvidence.assessmentResultId).toBeDefined();
		expect(finalizationEvidence.bigfiveFacet).toBeDefined();
		expect(finalizationEvidence.score).toBeDefined();
		expect(finalizationEvidence.confidence).toBeDefined();
		expect(finalizationEvidence.domain).toBeDefined();
		expect(finalizationEvidence.rawDomain).toBeDefined();
		expect(finalizationEvidence.quote).toBeDefined();
		expect(finalizationEvidence.highlightStart).toBeDefined();
		expect(finalizationEvidence.highlightEnd).toBeDefined();
		expect(finalizationEvidence.createdAt).toBeDefined();
	});
});

describe("Assessment Results Schema", () => {
	it("should have JSONB and TEXT columns", () => {
		expect(assessmentResults.id).toBeDefined();
		expect(assessmentResults.assessmentSessionId).toBeDefined();
		expect(assessmentResults.facets).toBeDefined();
		expect(assessmentResults.traits).toBeDefined();
		expect(assessmentResults.domainCoverage).toBeDefined();
		expect(assessmentResults.portrait).toBeDefined();
		expect(assessmentResults.createdAt).toBeDefined();
	});
});

describe("Public Profile Schema", () => {
	it("should have dual FK (session + result)", () => {
		expect(publicProfile.sessionId).toBeDefined();
		expect(publicProfile.assessmentResultId).toBeDefined();
	});
});
