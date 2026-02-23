/**
 * HTTP API Error Classes
 *
 * Re-exported from @workspace/domain where they are canonically defined.
 * Contracts consumers can continue importing from "@workspace/contracts" or "@workspace/contracts/errors".
 */

export {
	AgentInvocationError,
	AnalyzerError,
	AssessmentAlreadyExists,
	ConcurrentMessageError,
	ConversationEvidenceError,
	CostLimitExceeded,
	DatabaseError,
	FinalizationInProgressError,
	FreeTierLimitReached,
	InvalidCredentials,
	InvalidFacetNameError,
	MalformedEvidenceError,
	MessageRateLimitError,
	NerinError,
	ProfileError,
	ProfileNotFound,
	ProfilePrivate,
	RateLimitExceeded,
	SessionCompletedError,
	SessionExpired,
	SessionNotCompleted,
	SessionNotFinalizing,
	SessionNotFound,
	Unauthorized,
	UserAlreadyExists,
} from "@workspace/domain/errors/http.errors";
