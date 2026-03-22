/**
 * QR Token HTTP API Group (Story 34-1 — ADR-10)
 *
 * Authenticated endpoints for QR token lifecycle:
 * - Generate: create QR token with 6h TTL
 * - Status: poll token status (valid/accepted/expired)
 * - Accept: accept token, consume credit, create analysis placeholder
 * - Refuse: refuse token (stays active for others)
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import {
	DatabaseError,
	InsufficientCreditsError,
	QrTokenAlreadyAcceptedError,
	QrTokenExpiredError,
	QrTokenNotFoundError,
	SelfInvitationError,
} from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";

// ─── Schemas ──────────────────────────────────────────────────────────────

const GenerateQrTokenResponseSchema = S.Struct({
	token: S.String,
	shareUrl: S.String,
	expiresAt: S.DateTimeUtc,
});

const QrTokenStatusResponseSchema = S.Struct({
	status: S.Literal("valid", "accepted", "expired"),
});

const AcceptQrTokenResponseSchema = S.Struct({
	analysisId: S.String,
});

const RefuseQrTokenResponseSchema = S.Struct({
	ok: S.Literal(true),
});

const QrTokenDetailsResponseSchema = S.Struct({
	tokenStatus: S.Literal("valid", "accepted", "expired"),
	initiator: S.Struct({
		name: S.String,
		archetypeName: S.String,
		oceanCode4: S.String,
		oceanCode5: S.String,
		description: S.String,
		color: S.String,
		isCurated: S.Boolean,
		overallConfidence: S.Number,
	}),
	acceptor: S.Struct({
		overallConfidence: S.Number,
		availableCredits: S.Number,
		hasCompletedAssessment: S.Boolean,
	}),
});

// ─── QR Token Group (authenticated) ─────────────────────────────────────

export const QrTokenGroup = HttpApiGroup.make("qrToken")
	.add(
		HttpApiEndpoint.post("generateQrToken", "/qr/generate")
			.addSuccess(GenerateQrTokenResponseSchema)
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getQrTokenStatus", "/qr/:token/status")
			.setPath(S.Struct({ token: S.String }))
			.addSuccess(QrTokenStatusResponseSchema)
			.addError(QrTokenNotFoundError, { status: 404 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("acceptQrToken", "/qr/:token/accept")
			.setPath(S.Struct({ token: S.String }))
			.addSuccess(AcceptQrTokenResponseSchema)
			.addError(QrTokenNotFoundError, { status: 404 })
			.addError(QrTokenExpiredError, { status: 410 })
			.addError(QrTokenAlreadyAcceptedError, { status: 409 })
			.addError(SelfInvitationError, { status: 400 })
			.addError(InsufficientCreditsError, { status: 402 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getQrTokenDetails", "/qr/:token/details")
			.setPath(S.Struct({ token: S.String }))
			.addSuccess(QrTokenDetailsResponseSchema)
			.addError(QrTokenNotFoundError, { status: 404 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("refuseQrToken", "/qr/:token/refuse")
			.setPath(S.Struct({ token: S.String }))
			.addSuccess(RefuseQrTokenResponseSchema)
			.addError(QrTokenNotFoundError, { status: 404 })
			.addError(QrTokenExpiredError, { status: 410 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/relationship");

// Export TypeScript types for frontend use
export type GenerateQrTokenResponse = typeof GenerateQrTokenResponseSchema.Type;
export type QrTokenStatusResponse = typeof QrTokenStatusResponseSchema.Type;
export type AcceptQrTokenResponse = typeof AcceptQrTokenResponseSchema.Type;
export type RefuseQrTokenResponse = typeof RefuseQrTokenResponseSchema.Type;
export type QrTokenDetailsResponse = typeof QrTokenDetailsResponseSchema.Type;
