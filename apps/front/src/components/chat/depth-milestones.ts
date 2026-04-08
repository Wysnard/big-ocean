export const DEFAULT_MILESTONES = [0.25, 0.5, 0.75] as const;

const FIFTEEN_TURN_MILESTONE_TURNS = new Map<number, number>([
	[25, 4],
	[50, 8],
	[75, 11],
]);

export function getMilestoneLabel(milestone: number): number {
	return Math.round(milestone * 100);
}

export function getMilestoneTurn(totalTurns: number, milestone: number): number | null {
	if (totalTurns <= 0) {
		return null;
	}

	const label = getMilestoneLabel(milestone);

	if (totalTurns === 15) {
		return FIFTEEN_TURN_MILESTONE_TURNS.get(label) ?? null;
	}

	return Math.ceil(totalTurns * milestone);
}

export function getMilestonePositionPercent(totalTurns: number, milestone: number): number {
	const turn = getMilestoneTurn(totalTurns, milestone);
	if (turn !== null && totalTurns > 0) {
		return (turn / totalTurns) * 100;
	}

	return getMilestoneLabel(milestone);
}

export function isMilestoneReached(
	currentTurn: number,
	totalTurns: number,
	milestone: number,
): boolean {
	const turn = getMilestoneTurn(totalTurns, milestone);
	if (turn !== null) {
		return currentTurn >= turn;
	}

	if (totalTurns <= 0) {
		return false;
	}

	return currentTurn / totalTurns >= milestone;
}
