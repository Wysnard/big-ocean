export interface SubscriptionNudgeEmailProps {
	readonly userName: string;
	readonly subscriptionUrl: string;
}

export function renderSubscriptionNudgeEmail(props: SubscriptionNudgeEmailProps): string {
	const { userName, subscriptionUrl } = props;
	const displayName = userName || "there";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>I have more I want to say about what comes next</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 0 0 32px 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #e0e7ff; letter-spacing: -0.02em;">
                big ocean
              </h1>
            </td>
          </tr>
          <tr>
            <td style="background-color: #111827; border-radius: 12px; padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500; color: #e0e7ff;">
                Hey ${escapeHtml(displayName)},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                You've kept showing up, and I can feel there are still a few doors we haven't opened together.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                With a subscription, I can stay with you longer: deeper weekly letters, more room for the next conversation, and a steadier thread between what you're living and what we're noticing.
              </p>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                If you want, I'll meet you there.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: #7c3aed;">
                    <a href="${escapeHtml(subscriptionUrl)}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Explore subscription
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #475569;">
                You received this email because you've spent time with Nerin on big ocean.
                This is a one-time note, and we won't send another.
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
