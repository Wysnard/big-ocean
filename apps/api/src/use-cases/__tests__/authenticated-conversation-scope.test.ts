import type { ConversationEntity } from "@workspace/domain/entities/conversation.entity";
import { describe, expect, it } from "vitest";
import type { AuthenticatedConversation } from "../authenticated-conversation/access";
import {
	type AuthenticatedConversationScopeMode,
	resolveAuthenticatedConversationScope,
} from "../authenticated-conversation/scope";

const makeConversation = (
	parentConversationId: string | null,
	modePolicy: AuthenticatedConversation["policy"] = "owned-session",
): AuthenticatedConversation => ({
	policy: modePolicy,
	session: {
		id: parentConversationId ? "extension_session" : "base_session",
		userId: "user_123",
		createdAt: new Date(),
		updatedAt: new Date(),
		status: "completed",
		finalizationProgress: "completed",
		messageCount: 12,
		parentConversationId,
	} satisfies ConversationEntity,
});

const resolve = (
	parentConversationId: string | null,
	mode: AuthenticatedConversationScopeMode = "default",
) => resolveAuthenticatedConversationScope(makeConversation(parentConversationId), mode);

describe("Authenticated Conversation scope resolution", () => {
	it("uses current-session scope for base assessments by default", () => {
		expect(resolve(null)).toMatchObject({
			kind: "current-session",
			sessionId: "base_session",
			userId: "user_123",
			parentConversationId: null,
		});
	});

	it("uses the Living Personality Model for extension sessions by default", () => {
		expect(resolve("parent_session")).toMatchObject({
			kind: "living-personality-model",
			sessionId: "extension_session",
			userId: "user_123",
			parentConversationId: "parent_session",
		});
	});

	it("allows explicit current-session overrides for extension sessions", () => {
		expect(resolve("parent_session", "current-session").kind).toBe("current-session");
	});

	it("allows explicit Living Personality Model overrides for base assessments", () => {
		expect(resolve(null, "living-personality-model").kind).toBe("living-personality-model");
	});
});
