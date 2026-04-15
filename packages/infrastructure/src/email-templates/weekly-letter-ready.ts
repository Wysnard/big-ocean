/**
 * Weekly letter ready — push copy + HTML email (Story 5.3).
 *
 * Plain HTML string (same pattern as relationship-analysis-ready).
 */

import { WEEKLY_LETTER_HEADLINE } from "@workspace/contracts";
import { renderEmailHeader } from "./email-header";

export const WEEKLY_LETTER_READY_PUSH_TITLE = "Your week with Nerin";

/** Derived from the shared headline constant so card + notification copy stay in sync. */
export const WEEKLY_LETTER_READY_PUSH_BODY = `${WEEKLY_LETTER_HEADLINE}.`;

export function buildWeeklyLetterReadyEmailSubject(): string {
	return WEEKLY_LETTER_READY_PUSH_TITLE;
}

export interface WeeklyLetterReadyEmailProps {
	readonly userName: string;
	readonly letterUrl: string;
}

export function renderWeeklyLetterReadyEmail(props: WeeklyLetterReadyEmailProps): string {
	const { userName, letterUrl } = props;
	const displayName = userName?.trim() || "there";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(WEEKLY_LETTER_READY_PUSH_TITLE)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 0 0 32px 0; text-align: center;">
${renderEmailHeader()}
            </td>
          </tr>
          <tr>
            <td style="background-color: #111827; border-radius: 12px; padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500; color: #e0e7ff;">
                Hey ${escapeHtml(displayName)},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                ${escapeHtml(WEEKLY_LETTER_READY_PUSH_BODY)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: #7c3aed;">
                    <a href="${escapeHtml(letterUrl)}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Read your letter
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #475569;">
                You received this because your weekly letter from Nerin is ready on big ocean.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
