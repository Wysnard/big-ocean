const RESULTS_GATE_STORAGE_KEY = "big-ocean:results-auth-gate";
export const RESULTS_GATE_TTL_MS = 24 * 60 * 60 * 1000;

interface StoredResultsGateSession {
	sessionId: string;
	savedAt: number;
}

export interface PendingResultsGateSession extends StoredResultsGateSession {
	expiresAt: number;
	expired: boolean;
}

export function readPendingResultsGateSession(now = Date.now()): PendingResultsGateSession | null {
	if (typeof window === "undefined") {
		return null;
	}

	const raw = window.localStorage.getItem(RESULTS_GATE_STORAGE_KEY);
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as Partial<StoredResultsGateSession>;
		if (typeof parsed.sessionId !== "string" || typeof parsed.savedAt !== "number") {
			window.localStorage.removeItem(RESULTS_GATE_STORAGE_KEY);
			return null;
		}

		const expiresAt = parsed.savedAt + RESULTS_GATE_TTL_MS;
		return {
			sessionId: parsed.sessionId,
			savedAt: parsed.savedAt,
			expiresAt,
			expired: now > expiresAt,
		};
	} catch {
		window.localStorage.removeItem(RESULTS_GATE_STORAGE_KEY);
		return null;
	}
}

export function persistPendingResultsGateSession(sessionId: string, now = Date.now()): void {
	if (typeof window === "undefined") {
		return;
	}

	const payload: StoredResultsGateSession = {
		sessionId,
		savedAt: now,
	};
	window.localStorage.setItem(RESULTS_GATE_STORAGE_KEY, JSON.stringify(payload));
}

export function clearPendingResultsGateSession(sessionId?: string): void {
	if (typeof window === "undefined") {
		return;
	}

	if (!sessionId) {
		window.localStorage.removeItem(RESULTS_GATE_STORAGE_KEY);
		return;
	}

	const pending = readPendingResultsGateSession();
	if (pending && pending.sessionId === sessionId) {
		window.localStorage.removeItem(RESULTS_GATE_STORAGE_KEY);
	}
}
