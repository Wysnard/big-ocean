import type { CheckInPayload } from "@workspace/contracts";

export const moodOptions: Array<{
	value: CheckInPayload["mood"];
	label: string;
	emoji: string;
}> = [
	{ value: "great", label: "Great", emoji: "😄" },
	{ value: "good", label: "Good", emoji: "🙂" },
	{ value: "okay", label: "Okay", emoji: "😌" },
	{ value: "uneasy", label: "Uneasy", emoji: "😕" },
	{ value: "rough", label: "Rough", emoji: "😣" },
];

const fallbackMood = { value: "okay" as CheckInPayload["mood"], label: "Unknown", emoji: "❓" };

export const getMoodMeta = (mood: CheckInPayload["mood"]) =>
	moodOptions.find((item) => item.value === mood) ?? fallbackMood;
