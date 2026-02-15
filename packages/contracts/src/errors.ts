/**
 * HTTP API Error Classes
 *
 * Re-exported from @workspace/domain where they are canonically defined.
 * Contracts consumers can continue importing from "@workspace/contracts" or "@workspace/contracts/errors".
 */

export {
	AgentInvocationError,
	AnalyzerError,
	CostLimitExceeded,
	DatabaseError,
	FreeTierLimitReached,
	InvalidCredentials,
	InvalidFacetNameError,
	MalformedEvidenceError,
	ProfileError,
	ProfileNotFound,
	ProfilePrivate,
	RateLimitExceeded,
	SessionExpired,
	SessionNotFound,
	Unauthorized,
	UserAlreadyExists,
} from "@workspace/domain/errors/http.errors";
