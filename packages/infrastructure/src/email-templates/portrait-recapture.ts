/**
 * Deferred Portrait Recapture Email Template (Story 38-2)
 *
 * Pure function that returns an HTML email string.
 * No JSX/React Email — plain template literals for zero-dependency rendering.
 *
 * Sent a few days after assessment completion to users who skipped PWYW.
 * Warm, inviting Nerin voice — reminds them their portrait is waiting.
 */

export interface RecaptureEmailProps {
	readonly userName: string;
	readonly resultsUrl: string;
}

/**
 * Renders the deferred portrait recapture email as an HTML string.
 *
 * Uses Nerin's warm, inviting voice to remind the user that
 * their portrait is waiting to be unlocked.
 */
export function renderRecaptureEmail(props: RecaptureEmailProps): string {
	const { userName, resultsUrl } = props;
	const displayName = userName || "there";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nerin's portrait is waiting for you</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #e0e7ff; letter-spacing: -0.02em;">
                big ocean
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #111827; border-radius: 12px; padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500; color: #e0e7ff;">
                Hey ${escapeHtml(displayName)},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                I wrote something for you after our conversation. It's a portrait — not the kind you hang on a wall, but the kind that makes you pause and think <em style="color: #c4b5fd;">"yeah, that's me."</em>
              </p>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                It's still here whenever you're ready.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: #7c3aed;">
                    <a href="${escapeHtml(resultsUrl)}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Unlock your portrait
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
                This is a one-time reminder — we won't send another.
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
