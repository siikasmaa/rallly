/**
 * Inline email templates replacing fs.readFileSync + Eta.
 * Templates use simple string interpolation instead of Eta template engine.
 */

interface TemplateVars {
  [key: string]: string | undefined;
}

const emailStyles = `
<style>
.hover-bg-indigo-400:hover { background-color: #818cf8 !important; }
.hover-underline:hover { text-decoration: underline !important; }
.hover-no-underline:hover { text-decoration: none !important; }
@media (max-width: 600px) {
  .sm-w-full { width: 100% !important; }
  .sm-py-32 { padding-top: 32px !important; padding-bottom: 32px !important; }
  .sm-px-24 { padding-left: 24px !important; padding-right: 24px !important; }
}
</style>`;

const msoStyles = `<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office"><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>td,th,div,p,a,h1,h2,h3,h4,h5,h6{font-family:"Segoe UI",sans-serif;mso-line-height-rule:exactly;}</style>
<![endif]-->`;

function header(homePageUrl: string) {
  return `<tr>
  <td class="sm-py-32 sm-px-24" style="padding-left:48px;padding-right:48px;padding-top:36px;padding-bottom:36px;text-align:center;">
    <a href="${homePageUrl}"><img src="${homePageUrl}/logo.png" width="150" alt="Rallly" style="max-width:100%;vertical-align:middle;line-height:100%;border:0;"></a>
  </td>
</tr>`;
}

function footer(homePageUrl: string, supportEmail: string | undefined) {
  return `<tr><td style="height:48px;"></td></tr>
<tr>
  <td style="padding-left:24px;padding-right:24px;text-align:center;font-size:12px;color:#4b5563;">
    <p style="margin-bottom:4px;text-transform:uppercase;">RALLLY</p>
    <p style="font-style:italic;">Collaborative Scheduling</p>
    <p style="cursor:default;">
      <a href="${homePageUrl}" class="hover-underline" style="color:#6366f1;text-decoration:none;">Website</a> &bull;
      <a href="https://twitter.com/ralllyco" class="hover-underline" style="color:#6366f1;text-decoration:none;">Twitter</a> &bull;
      <a href="https://github.com/lukevella/rallly" class="hover-underline" style="color:#6366f1;text-decoration:none;">Github</a> &bull;
      <a href="mailto:${supportEmail ?? ""}" class="hover-underline" style="color:#6366f1;text-decoration:none;">Contact</a>
    </p>
  </td>
</tr>`;
}

function divider() {
  return `<table style="width:100%;" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="padding-top:32px;padding-bottom:32px;"><div style="height:1px;background-color:#e5e7eb;line-height:1px;">&zwnj;</div></td></tr></table>`;
}

function notSureNote(supportEmail: string | undefined) {
  return `<p>Not sure why you received this email? Please <a href="mailto:${supportEmail ?? ""}" class="hover-no-underline" style="color:#6366f1;text-decoration:underline;">let us know</a>.</p>`;
}

function button(url: string, text: string) {
  return `<div style="line-height:100%;"><a href="${url}" class="hover-bg-indigo-400" style="display:inline-block;border-radius:4px;background-color:#6366f1;padding:16px 24px;text-align:center;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;"><!--[if mso]><i style="letter-spacing:27px;mso-font-width:-100%;mso-text-raise:26pt;">&nbsp;</i><![endif]--><span style="mso-text-raise:16px">${text} &rarr;</span><!--[if mso]><i style="letter-spacing:27px;mso-font-width:-100%;">&nbsp;</i><![endif]--></a></div>`;
}

function wrap(title: string, preheader: string, homePageUrl: string, body: string, supportEmail: string | undefined) {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="utf-8"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="x-ua-compatible" content="ie=edge">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
${msoStyles}<title>${title}</title>${emailStyles}
</head>
<body style="margin:0;width:100%;padding:0;word-break:break-word;-webkit-font-smoothing:antialiased;background-color:#f3f4f6;">
<div style="display:none;">${preheader}</div>
<div role="article" aria-roledescription="email" aria-label="${title}" lang="en">
<table style="width:100%;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="background-color:#f3f4f6;">
<table class="sm-w-full" style="width:600px;" cellpadding="0" cellspacing="0" role="presentation">
${header(homePageUrl)}
<tr><td align="center" class="sm-px-24">
<table style="width:100%;" cellpadding="0" cellspacing="0" role="presentation">
<tr><td class="sm-px-24" style="border-radius:4px;background-color:#ffffff;padding:36px;text-align:left;font-size:16px;line-height:24px;color:#1f2937;">
${body}
${divider()}
${notSureNote(supportEmail)}
</td></tr>
${footer(homePageUrl, supportEmail)}
</table>
</td></tr>
</table>
</td></tr>
</table>
</div>
</body>
</html>`;
}

const templates: Record<string, (vars: TemplateVars) => string> = {
  login: (v) =>
    wrap(
      "Login with your email",
      "Please click the link below to verify your email address.",
      v.homePageUrl ?? "",
      `<p style="margin-bottom:8px;">Hey there,</p>
<p style="margin-bottom:8px;">To login with your email please click the button below:</p>
<p style="margin-bottom:24px;"></p>
${button(v.loginUrl ?? "", "Log me in")}`,
      v.supportEmail,
    ),

  "new-poll": (v) =>
    wrap(
      "Your poll has been created",
      "Please click the link below to verify your email address!",
      v.homePageUrl ?? "",
      `<p style="margin-bottom:8px;">Hi ${v.name},</p>
<p style="margin-bottom:8px;">Your poll <strong>"${v.title}"</strong> has been created. Please verify your email address to claim ownership of this&nbsp;poll:</p>
<p style="margin-bottom:24px;"></p>
<div style="margin-bottom:24px;line-height:100%;">${button(v.verifyEmailUrl ?? "", "Verify your email")}</div>
<p style="margin-bottom:8px;">In case you lose it, here's a link to your poll for the future</p>
<p style="font-weight:500;"><a href="${v.pollUrl}" style="display:inline-block;background-color:#eef2ff;padding:8px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:20px;color:#6366f1;text-decoration:none;">${v.pollUrl}</a></p>`,
      v.supportEmail,
    ),

  "new-poll-verified": (v) =>
    wrap(
      "Your poll has been created",
      "Click the button below to access your poll!",
      v.homePageUrl ?? "",
      `<p style="margin-bottom:8px;">Hi ${v.name},</p>
<p style="margin-bottom:8px;">Your poll <strong>"${v.title}"</strong> has been created.</p>
<p style="margin-bottom:24px;"></p>
${button(v.pollUrl ?? "", "Go to poll")}`,
      v.supportEmail,
    ),

  "new-participant": (v) =>
    wrap(
      "Your poll has a new participant",
      "Go to your poll to see how they voted",
      v.homePageUrl ?? "",
      `<p style="margin-bottom:8px;">Hi ${v.name},</p>
<p style="margin-bottom:8px;"><strong>${v.participantName}</strong> has voted on your&nbsp;poll.</p>
<p style="margin-bottom:24px;"></p>
<div style="margin-bottom:24px;line-height:100%;">${button(v.pollUrl ?? "", "Go to poll")}</div>
<p><a href="${v.unsubscribeUrl}" class="hover-no-underline" style="color:#6366f1;text-decoration:underline;">Stop receiving notifications for this poll.</a></p>`,
      v.supportEmail,
    ),

  "new-comment": (v) =>
    wrap(
      "Someone left a comment on your poll",
      "Go to your poll to see what they wrote",
      v.homePageUrl ?? "",
      `<p style="margin-bottom:8px;">Hi ${v.name},</p>
<p style="margin-bottom:8px;"><strong>${v.author}</strong> has left a comment on your&nbsp;poll.</p>
<p style="margin-bottom:24px;"></p>
<div style="margin-bottom:24px;line-height:100%;">${button(v.pollUrl ?? "", "Go to poll")}</div>
<p><a href="${v.unsubscribeUrl}" class="hover-no-underline" style="color:#6366f1;text-decoration:underline;">Stop receiving notifications for this poll.</a></p>`,
      v.supportEmail,
    ),
};

export function renderEmailTemplate(
  templateName: string,
  vars: TemplateVars,
): string {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Unknown email template: ${templateName}`);
  }
  return template(vars);
}
