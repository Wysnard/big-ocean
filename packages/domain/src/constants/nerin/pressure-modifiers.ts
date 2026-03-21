/**
 * Entry Pressure Modifiers — Story 28-3
 *
 * 3 pressure modifiers that modulate how directly Nerin approaches a territory.
 * Applied to `explore` intent (and later `bridge` intent in Epic 2).
 *
 * Pressure is derived from the gap between E_target and territory expectedEnergy
 * by the Move Governor.
 */

import type { EntryPressure } from "../../types/pacing";

// ─── Pressure Modifier Constants ────────────────────────────────────

/** Direct pressure — go straight to the territory. */
export const PRESSURE_DIRECT = "Go straight there.";

/** Angled pressure — approach from an adjacent thread. Absorbs guarded-handling from CONVERSATION_INSTINCTS. */
export const PRESSURE_ANGLED =
	"Find a thread from what they've shared that bends toward it. If they're guarded, come at it from a different direction. If you see something interesting but it's not where your curiosity is pointing — flag it and leave it.";

/** Soft pressure — only if conversation opens naturally. */
export const PRESSURE_SOFT =
	"Only if the conversation opens toward it naturally. If not, stay where you are. If you see a thread worth holding, name it — \"there's something there, we'll come back to it.\"";

// ─── Lookup Function ────────────────────────────────────────────────

/** Pressure modifier lookup — exhaustive over EntryPressure values. */
const PRESSURE_MAP: Record<EntryPressure, string> = {
	direct: PRESSURE_DIRECT,
	angled: PRESSURE_ANGLED,
	soft: PRESSURE_SOFT,
};

/**
 * Get the pressure modifier string for the given entry pressure level.
 *
 * @param pressure - The entry pressure level from the Move Governor
 * @returns The pressure modifier prose instruction
 */
export function getPressureModifier(pressure: EntryPressure): string {
	return PRESSURE_MAP[pressure];
}
