/**
 * Nerin Check-in Email Template (Story 38-1)
 *
 * Pure function that returns an HTML email string.
 * No JSX/React Email — plain template literals for zero-dependency rendering.
 *
 * Sent ~2 weeks after assessment completion. Nerin-voiced, warm, curious.
 * References the last conversation territory as a tension/theme.
 */

import { renderEmailHeader } from "./email-header";

export interface CheckInEmailProps {
	readonly userName: string;
	readonly territoryDescription: string;
	readonly resultsUrl: string;
}

/**
 * Renders the Nerin check-in email as an HTML string.
 *
 * The email uses Nerin's warm, curious voice and references
 * the last conversation territory as something he's been thinking about.
 */
export function renderCheckInEmail(props: CheckInEmailProps): string {
	const { userName, territoryDescription, resultsUrl } = props;
	const displayName = userName || "there";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>I've been thinking about something you said</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px 0; text-align: center;">
${renderEmailHeader()}
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #111827; border-radius: 12px; padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500; color: #e0e7ff;">
                Hey ${escapeHtml(displayName)},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                I've been thinking about our conversation — especially <strong style="color: #c4b5fd;">${escapeHtml(territoryDescription)}</strong>. There's more to explore there if you're curious.
              </p>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                Your portrait and results are still here. Come back whenever you're ready.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: #7c3aed;">
                    <a href="${escapeHtml(resultsUrl)}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Continue with Nerin
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #475569;">
                You received this email because you completed a conversation with Nerin on big ocean.
                This is a one-time check-in — we won't send another.
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

/** Escape HTML special characters to prevent XSS in email content */
function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
