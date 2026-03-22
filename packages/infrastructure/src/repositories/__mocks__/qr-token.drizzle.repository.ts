/**
 * Mock: qr-token.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/qr-token.drizzle.repository')
 */

import type { QrToken } from "@workspace/domain";
import {
	QrTokenAlreadyAcceptedError,
	QrTokenExpiredError,
	QrTokenNotFoundError,
	QrTokenRepository,
	SelfInvitationError,
} from "@workspace/domain";
import { QR_TOKEN_TTL_HOURS } from "@workspace/domain/types/relationship.types";
import { Effect, Layer } from "effect";

const store = new Map<string, QrToken>();
const tokenIndex = new Map<string, string>(); // token → id

/** Clear in-memory state between tests. */
export const _resetMockState = () => {
	store.clear();
	tokenIndex.clear();
};

/** Get stored token for test assertions. */
export const _getTokenByToken = (token: string): QrToken | undefined => {
	const id = tokenIndex.get(token);
	return id ? store.get(id) : undefined;
};

const deriveStatus = (qrToken: QrToken): QrToken => {
	if (qrToken.status === "active" && qrToken.expiresAt < new Date()) {
		return { ...qrToken, status: "expired" };
	}
	return qrToken;
};

export const QrTokenDrizzleRepositoryLive = Layer.succeed(
	QrTokenRepository,
	QrTokenRepository.of({
		generate: (userId) =>
			Effect.sync(() => {
				const token: QrToken = {
					id: crypto.randomUUID(),
					userId,
					token: crypto.randomUUID(),
					expiresAt: new Date(Date.now() + QR_TOKEN_TTL_HOURS * 60 * 60 * 1000),
					status: "active",
					acceptedByUserId: null,
					createdAt: new Date(),
				};
				store.set(token.id, token);
				tokenIndex.set(token.token, token.id);
				return token;
			}),

		getByToken: (token) =>
			Effect.gen(function* () {
				const id = tokenIndex.get(token);
				if (!id) {
					return yield* Effect.fail(
						new QrTokenNotFoundError({ message: `QR token not found: ${token}` }),
					);
				}
				const qrToken = store.get(id);
				if (!qrToken) {
					return yield* Effect.fail(
						new QrTokenNotFoundError({ message: `QR token not found: ${token}` }),
					);
				}
				return deriveStatus(qrToken);
			}),

		getStatus: (token) =>
			Effect.gen(function* () {
				const id = tokenIndex.get(token);
				if (!id) {
					return yield* Effect.fail(
						new QrTokenNotFoundError({ message: `QR token not found: ${token}` }),
					);
				}
				const qrToken = store.get(id);
				if (!qrToken) {
					return yield* Effect.fail(
						new QrTokenNotFoundError({ message: `QR token not found: ${token}` }),
					);
				}
				const derived = deriveStatus(qrToken);
				if (derived.status === "accepted") return "accepted" as const;
				if (derived.status === "expired") return "expired" as const;
				return "valid" as const;
			}),

		accept: (input) =>
			Effect.gen(function* () {
				const id = tokenIndex.get(input.token);
				if (!id) {
					return yield* Effect.fail(new QrTokenNotFoundError({ message: "QR token not found" }));
				}
				const qrToken = store.get(id);
				if (!qrToken) {
					return yield* Effect.fail(new QrTokenNotFoundError({ message: "QR token not found" }));
				}
				if (qrToken.userId === input.acceptedByUserId) {
					return yield* Effect.fail(
						new SelfInvitationError({ message: "You cannot accept your own QR token" }),
					);
				}
				if (qrToken.status === "accepted") {
					return yield* Effect.fail(
						new QrTokenAlreadyAcceptedError({ message: "QR token has already been accepted" }),
					);
				}
				if (qrToken.status === "expired" || qrToken.expiresAt < new Date()) {
					return yield* Effect.fail(new QrTokenExpiredError({ message: "QR token has expired" }));
				}
				const updated: QrToken = {
					...qrToken,
					acceptedByUserId: input.acceptedByUserId,
					status: "accepted",
				};
				store.set(id, updated);
				return updated;
			}),

		expireToken: (token) =>
			Effect.sync(() => {
				const id = tokenIndex.get(token);
				if (id) {
					const existing = store.get(id);
					if (existing) {
						store.set(id, { ...existing, status: "expired" });
					}
				}
			}),

		getActiveByUserId: (userId) =>
			Effect.sync(() => {
				for (const qrToken of store.values()) {
					if (
						qrToken.userId === userId &&
						qrToken.status === "active" &&
						qrToken.expiresAt > new Date()
					) {
						return qrToken;
					}
				}
				return null;
			}),

		getByTokenWithInitiatorName: (token) =>
			Effect.gen(function* () {
				const id = tokenIndex.get(token);
				if (!id) {
					return yield* Effect.fail(
						new QrTokenNotFoundError({ message: `QR token not found: ${token}` }),
					);
				}
				const qrToken = store.get(id);
				if (!qrToken) {
					return yield* Effect.fail(
						new QrTokenNotFoundError({ message: `QR token not found: ${token}` }),
					);
				}
				return { ...deriveStatus(qrToken), initiatorName: "Test User" };
			}),
	}),
);
