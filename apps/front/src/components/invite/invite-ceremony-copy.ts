/**
 * Locked invite ceremony copy (UX spec §10.7 — design review required for edits).
 */

export const INVITE_CEREMONY_HEADING = "INVITE SOMEONE YOU CARE ABOUT";

export const INVITE_CEREMONY_BODY_PARAGRAPHS = [
	"Discover the dynamic between you.",
	"When they finish their conversation with Nerin, the two of you get a letter about your relationship — the parts that click, the parts that clash, and the unspoken rhythms you've been navigating for years.",
	"You'll also see a side of yourself that only shows up around them.",
	"Most people say it names something they've felt but never put into words.",
] as const;

/** Visual divider between beats — locked from UX spec */
export const INVITE_CEREMONY_DIVIDER = "─ ─ ─ ─ ─ ─ ─ ─ ─ ─";

export const INVITE_CEREMONY_THEIR_SIDE = [
	"Their side: a 30-minute conversation with Nerin. No forms. No quizzes. Just someone curious about them.",
	"It stays between the two of you.",
] as const;

/** Used as the dialog's accessible description (sr-only) */
export const INVITE_CEREMONY_DIALOG_DESCRIPTION =
	"Invite someone you care about into your Circle with a private link or QR code.";

/** Pre-populated text for native share sheet — user-visible on platform share UI */
export const INVITE_CEREMONY_SHARE_TEXT =
	"You're invited to discover your dynamic together on Big Ocean.";

export const INVITE_CEREMONY_NAME_PROMPT = "Who are you inviting?";

export const INVITE_CEREMONY_NAME_PLACEHOLDER = "Their name (optional)";

export const INVITE_CEREMONY_SHARE_QR = "Share a QR to scan";

export const INVITE_CEREMONY_COPY_LINK = "Copy a link to send";

export const INVITE_CEREMONY_SHARE_NATIVE = "Share via…";
