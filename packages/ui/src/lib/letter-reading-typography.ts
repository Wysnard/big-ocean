/**
 * Shared Tailwind class strings for long-form / letter reading surfaces.
 * Use with `cn(...)` when composing with other utilities.
 */

/** Portrait & weekly markdown bodies (theme tokens). */
export const letterMarkdownBodyClass = "text-base leading-[1.7] text-foreground/80";

/** Relationship letter main stack (slightly higher contrast than portrait). */
export const letterRelationshipBodyWrapClass = "text-base leading-[1.7] text-foreground/90";

/** Subscription / conversion paragraphs on weekly letter (relaxed line height). */
export const letterWeeklyPromoBodyClass = "text-base leading-relaxed text-foreground/90";

/** Homepage marketing: weekly letter serif paragraphs on tinted cards. */
export const letterHomepageWeeklyBodyClass =
	"font-serif text-base leading-relaxed text-slate-800 dark:text-slate-100";

/** Homepage marketing: portrait phase serif pull quotes. */
export const letterHomepagePortraitBodyClass =
	"font-serif text-[1.45rem] leading-[1.75] text-slate-800";
