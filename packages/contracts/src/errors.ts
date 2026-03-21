/**
 * HTTP API Error Classes
 *
 * Re-exported from @workspace/domain where they are canonically defined.
 * Contracts consumers can continue importing from "@workspace/contracts" or "@workspace/contracts/errors".
 */

export {
	AccountNotFound,
	AgentInvocationError,
	AnalyzerError,
	AssessmentAlreadyExists,
	ConcurrentMessageError,
	ConversationEvidenceError,
	CostLimitExceeded,
	DatabaseError,
	FinalizationInProgressError,
	FreeTierLimitReached,
	GlobalAssessmentLimitReached,
	InsufficientCreditsError,
	InvalidCredentials,
	InvalidFacetNameError,
	InvitationAlreadyRespondedError,
	InvitationNotFoundError,
	QrTokenAlreadyAcceptedError,
	QrTokenExpiredError,
	QrTokenNotFoundError,
	MalformedEvidenceError,
	MessageRateLimitError,
	NerinError,
	ProfileError,
	ProfileNotFound,
	ProfilePrivate,
	RateLimitExceeded,
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisUnauthorizedError,
	SelfInvitationError,
	SessionCompletedError,
	SessionExpired,
	SessionNotCompleted,
	SessionNotFinalizing,
	SessionNotFound,
	Unauthorized,
	UnknownProductError,
	UserAlreadyExists,
	WebhookVerificationError,
} from "@workspace/domain/errors/http.errors";
