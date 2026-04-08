export const ASSESSMENT_MILESTONES = [
	{
		fraction: 0.25,
		label: 25,
		turnAt15: 4,
		message: "🫧 Great start — your personality portrait is beginning to emerge.",
	},
	{
		fraction: 0.5,
		label: 50,
		turnAt15: 8,
		message: "🐙 Halfway down — your personality portrait is taking shape.",
	},
	{
		fraction: 0.75,
		label: 75,
		turnAt15: 11,
		message: "🪸 Almost there — just a few more exchanges to complete your portrait.",
	},
] as const;

export const DEFAULT_MILESTONES = ASSESSMENT_MILESTONES.map((milestone) => milestone.fraction);

function getAssessmentMilestone(milestone: number) {
	const label = getMilestoneLabel(milestone);
	return ASSESSMENT_MILESTONES.find((candidate) => candidate.label === label) ?? null;
}

export function getMilestoneLabel(milestone: number): number {
	return Math.round(milestone * 100);
}

export function getMilestoneTurn(totalTurns: number, milestone: number): number | null {
	if (totalTurns <= 0) {
		return null;
	}

	if (totalTurns === 15) {
		return getAssessmentMilestone(milestone)?.turnAt15 ?? null;
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
