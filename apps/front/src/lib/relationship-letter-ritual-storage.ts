const storageKey = (analysisId: string) => `relationship-letter-ritual-seen:${analysisId}`;

export function hasSeenRelationshipLetterRitual(analysisId: string): boolean {
	if (typeof window === "undefined") return false;
	return window.localStorage.getItem(storageKey(analysisId)) === "1";
}

export function markRelationshipLetterRitualSeen(analysisId: string): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(storageKey(analysisId), "1");
}
