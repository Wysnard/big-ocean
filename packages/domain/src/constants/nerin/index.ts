/**
 * Nerin Character Modules
 *
 * After Director Model cleanup (Story 44-1), only PORTRAIT_CONTEXT remains
 * as a live module. All other character bible modules (Tier 1 + Tier 2)
 * were consumed only by the deleted pacing pipeline prompt builder.
 */

// Portrait context — letter-writing instructions for portrait generation
export { PORTRAIT_CONTEXT } from "./portrait-context";
