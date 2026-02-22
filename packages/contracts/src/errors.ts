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
	CostLimitExceeded,
	DatabaseError,
	FreeTierLimitReached,
	InvalidCredentials,
	InvalidFacetNameError,
	MalformedEvidenceError,
	NerinError,
	ProfileError,
	ProfileNotFound,
	ProfilePrivate,
	RateLimitExceeded,
	SessionCompletedError,
	SessionExpired,
	SessionNotFound,
	Unauthorized,
	UserAlreadyExists,
} from "@workspace/domain/errors/http.errors";
