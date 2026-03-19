/**
 * Password Reset Email Template (Story 31-7b)
 *
 * Pure function that returns an HTML email string.
 * No JSX/React Email — plain template literals for zero-dependency rendering.
 */

export interface PasswordResetEmailProps {
	readonly userName: string;
	readonly resetUrl: string;
}

/**
 * Renders the password reset email as an HTML string.
 *
 * Sent when a user requests a password reset via the "Forgot password?" flow.
 */
export function renderPasswordResetEmail(props: PasswordResetEmailProps): string {
	const { userName, resetUrl } = props;
	const displayName = userName || "there";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password — big ocean</title>
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
                We received a request to reset your password. Click the button below to choose a new one and get back to your journey with Nerin.
              </p>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                This link will expire in 1 hour.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: #7c3aed;">
                    <a href="${escapeHtml(resetUrl)}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Reset Your Password
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
                You received this email because a password reset was requested for your big ocean account.
                If you didn't request this, you can safely ignore this email — your password won't change.
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
