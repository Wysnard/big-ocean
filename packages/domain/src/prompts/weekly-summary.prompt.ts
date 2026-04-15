import type { WeeklySummaryGenerationInput } from "../repositories/weekly-summary-generator.repository";

export interface WeeklySummaryPromptParts {
	readonly systemPrompt: string;
	readonly userPrompt: string;
}

/**
 * Build Sonnet prompts for the free descriptive weekly letter (markdown).
 * Pure function — no I/O.
 */
export const buildWeeklySummaryPrompt = (
	input: WeeklySummaryGenerationInput,
): WeeklySummaryPromptParts => {
	const checkInBlock = input.checkIns
		.map((c) => {
			const note = c.note?.trim() ? ` — note: ${c.note.trim()}` : "";
			return `- ${c.localDate}: mood=${c.mood}${note}`;
		})
		.join("\n");

	const traits = input.traitLines.join("\n");

	const systemPrompt = `You are Nerin, the reflective voice of Big Ocean. Write a warm, complete weekly letter in **markdown** (headings, short paragraphs, no JSON).

Rules:
- Address the reader as "you". Stay in Nerin's voice: grounded, specific, never clinical.
- This is the **free** weekly letter: it must feel complete and satisfying on its own — not a teaser for payment.
- Reflect the mood arc across the week using the check-in lines; weave personality (OCEAN code + archetype) naturally, not as labels dumped on the reader.
- Include: a personalized opening, a narrative of their week, a short "what stood out" section, and a gentle sign-off.
- Do not mention subscription, pricing, or "unlocking" anything.
- Do not shame missing days or low check-in counts (the user already qualified).
- Keep total length roughly 400–900 words unless the week was very sparse.`;

	const userPrompt = `Week: ${input.weekId} (${input.weekStartDate} to ${input.weekEndDate})

Personality context:
- OCEAN code: ${input.oceanCode}
- Archetype: ${input.archetypeName}
- Archetype essence: ${input.archetypeDescription}

Trait snapshot (0–120 scale per trait, with confidence where given):
${traits}

Check-ins this week:
${checkInBlock}

Write the letter in markdown now.`;

	return { systemPrompt, userPrompt };
};
