import { createMimeMessage } from "mimetext";

interface SendEmailParameters {
  to: string;
  subject: string;
  html: string;
}

// Module-level reference to the SendEmail binding, set from middleware
let _sendEmailBinding: any = null;

/**
 * Initialize the email sender with the Cloudflare SendEmail binding.
 * Called from middleware when the runtime env is available.
 */
export function initEmail(sendEmailBinding: any) {
  _sendEmailBinding = sendEmailBinding;
}

/**
 * Send email using Cloudflare Email Workers (send_email binding).
 * https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
 */
export const sendEmail = async (params: SendEmailParameters) => {
  const supportEmail = process.env.SUPPORT_EMAIL;

  if (!supportEmail) {
    console.warn("Email not configured: SUPPORT_EMAIL missing");
    return;
  }

  if (!_sendEmailBinding) {
    console.warn(
      "Email not configured: send_email binding not available. " +
        "Ensure send_email is configured in wrangler.toml.",
    );
    return;
  }

  try {
    const msg = createMimeMessage();
    msg.setSender({ name: "Rallly", addr: supportEmail });
    msg.setRecipient(params.to);
    msg.setSubject(params.subject);
    msg.addMessage({
      contentType: "text/html",
      data: params.html,
    });

    const message = new EmailMessage(supportEmail, params.to, msg.asRaw());
    await _sendEmailBinding.send(message);
  } catch (e: any) {
    // Cloudflare Email Workers only delivers to verified destination addresses.
    // Sending to an unverified address throws — log it and move on so the
    // caller (poll creation, notifications, etc.) is not disrupted.
    if (
      e?.message?.includes("not a verified destination address") ||
      e?.message?.includes("Unknown address")
    ) {
      console.warn(
        `Email to ${params.to} skipped: address is not a verified ` +
          "destination in Cloudflare Email Routing. To deliver to " +
          "arbitrary addresses, configure an external email provider.",
      );
    } else {
      console.error("Error sending email:", e);
    }
  }
};
