import type { ConversationEntity } from "@workspace/domain/entities/conversation.entity";
import { describe, expect, it } from "vitest";
import {
	type AuthenticatedConversationAccessPolicy,
	getAuthenticatedConversationAccessFailureReason,
} from "../authenticated-conversation/access";

const makeSession = (
	status: ConversationEntity["status"],
	overrides: Partial<ConversationEntity> = {},
): ConversationEntity => ({
	id: "session_123",
	userId: "user_123",
	createdAt: new Date(),
	updatedAt: new Date(),
	status,
	finalizationProgress: null,
	messageCount: 0,
	parentConversationId: null,
	...overrides,
});

const reasonFor = (
	policy: AuthenticatedConversationAccessPolicy,
	session: ConversationEntity,
	authenticatedUserId = "user_123",
) =>
	getAuthenticatedConversationAccessFailureReason({
		session,
		authenticatedUserId,
		policy,
	});

describe("Authenticated Conversation access policies", () => {
	it("returns owner-mismatch before evaluating status policy", () => {
		expect(reasonFor("completed-read", makeSession("active"), "other_user")).toBe("owner-mismatch");
	});

	it("allows owned-session access for every session status", () => {
		for (const status of ["active", "paused", "finalizing", "completed", "archived"] as const) {
			expect(reasonFor("owned-session", makeSession(status))).toBeNull();
		}
	});

	it("requires active status for active-message", () => {
		expect(reasonFor("active-message", makeSession("active"))).toBeNull();
		expect(reasonFor("active-message", makeSession("finalizing"))).toBe("not-active");
		expect(reasonFor("active-message", makeSession("completed"))).toBe("not-active");
	});

	it("requires completed status for completed-read", () => {
		expect(reasonFor("completed-read", makeSession("completed"))).toBeNull();
		expect(reasonFor("completed-read", makeSession("finalizing"))).toBe("not-completed");
	});

	it("allows finalizing and completed statuses for finalization idempotency", () => {
		expect(reasonFor("finalization", makeSession("finalizing"))).toBeNull();
		expect(reasonFor("finalization", makeSession("completed"))).toBeNull();
		expect(reasonFor("finalization", makeSession("active"))).toBe("not-finalizing");
	});
});
