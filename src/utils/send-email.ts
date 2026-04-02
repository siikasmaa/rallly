interface SendEmailParameters {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email via external SMTP API using fetch.
 * Replaces nodemailer which requires Node.js net/tls modules.
 *
 * This implementation uses a generic SMTP-over-HTTP approach.
 * For production, configure with a service like Resend, SendGrid,
 * Postmark, or Mailchannels (free for CF Workers).
 */
export const sendEmail = async (params: SendEmailParameters) => {
  const smtpHost = process.env.SMTP_HOST;
  const supportEmail = process.env.SUPPORT_EMAIL;

  if (!smtpHost || !supportEmail) {
    console.warn("Email not configured: SMTP_HOST or SUPPORT_EMAIL missing");
    return;
  }

  try {
    // Use MailChannels API (free for Cloudflare Workers)
    // See: https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels/
    const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: params.to }],
          },
        ],
        from: {
          email: supportEmail,
          name: "Rallly",
        },
        subject: params.subject,
        content: [
          {
            type: "text/html",
            value: params.html,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        `Failed to send email: ${response.status} ${response.statusText}`,
      );
    }
  } catch (e) {
    console.error("Error sending email:", e);
  }
};
