import { describe, expect, it } from "vitest";
import {
	buildAuthPageHref,
	buildPostAuthRedirect,
	getActiveAssessmentSessionId,
} from "./auth-session-linking";

describe("auth-session-linking", () => {
	it("reads session id from search params", () => {
		expect(getActiveAssessmentSessionId("/chat", { sessionId: "session-search-123" })).toBe(
			"session-search-123",
		);
	});

	it("reads session id from /results/:sessionId pathname", () => {
		expect(getActiveAssessmentSessionId("/results/session-path-123", {})).toBe("session-path-123");
	});

	it("builds auth page href with session and redirect", () => {
		expect(
			buildAuthPageHref("/login", {
				sessionId: "session-123",
				redirectTo: "/chat",
			}),
		).toBe("/login?sessionId=session-123&redirectTo=%2Fchat");
	});

	it("adds session query to /chat post-auth redirect", () => {
		expect(
			buildPostAuthRedirect({
				redirectTo: "/chat",
				sessionId: "session-123",
			}),
		).toBe("/chat?sessionId=session-123");
	});

	it("builds /results path param for post-auth redirect", () => {
		expect(
			buildPostAuthRedirect({
				redirectTo: "/results",
				sessionId: "session-123",
			}),
		).toBe("/results/session-123");
	});

	it("keeps explicit session query in redirect unchanged", () => {
		expect(
			buildPostAuthRedirect({
				redirectTo: "/chat?sessionId=already-there",
				sessionId: "session-123",
			}),
		).toBe("/chat?sessionId=already-there");
	});

	it("falls back safely for invalid redirect", () => {
		expect(
			buildPostAuthRedirect({
				redirectTo: "https://evil.example",
				sessionId: "session-123",
			}),
		).toBe("/profile");
	});
});
