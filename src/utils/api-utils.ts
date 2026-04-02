import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { polls } from "@/db/schema";
import { notDeleted } from "@/db/soft-delete";

import { absoluteUrl } from "./absolute-url";
import { renderEmailTemplate } from "./email-templates";
import { sendEmail } from "./send-email";

type NotificationAction =
  | {
      type: "newParticipant";
      participantName: string;
    }
  | {
      type: "newComment";
      authorName: string;
    };

export const sendNotification = async (
  pollId: string,
  action: NotificationAction,
): Promise<void> => {
  try {
    const db = getDb();
    const poll = await db.query.polls.findFirst({
      where: and(eq(polls.id, pollId), notDeleted()),
      with: { user: true },
    });

    /**
     * poll needs to:
     * - exist
     * - be verified
     * - not be a demo
     * - have notifications turned on
     */
    if (
      poll &&
      poll?.user.email &&
      poll.verified &&
      !poll.demo &&
      poll.notifications
    ) {
      const homePageUrl = absoluteUrl();
      const pollUrl = `${homePageUrl}/admin/${poll.adminUrlId}`;
      const unsubscribeUrl = `${pollUrl}?unsubscribe=true`;

      switch (action.type) {
        case "newParticipant":
          await sendEmailTemplate({
            templateName: "new-participant",
            to: poll.user.email,
            subject: `Rallly: ${poll.title} - New Participant`,
            templateVars: {
              title: poll.title,
              name: poll.authorName,
              participantName: action.participantName,
              pollUrl,
              homePageUrl: absoluteUrl(),
              supportEmail: process.env.SUPPORT_EMAIL,
              unsubscribeUrl,
            },
          });
          break;
        case "newComment":
          await sendEmailTemplate({
            templateName: "new-comment",
            to: poll.user.email,
            subject: `Rallly: ${poll.title} - New Comment`,
            templateVars: {
              title: poll.title,
              name: poll.authorName,
              author: action.authorName,
              pollUrl,
              homePageUrl: absoluteUrl(),
              supportEmail: process.env.SUPPORT_EMAIL,
              unsubscribeUrl,
            },
          });
          break;
      }
    }
  } catch (e) {
    console.error(e);
  }
};

interface SendEmailTemplateParams {
  templateName: string;
  to: string;
  subject: string;
  templateVars: Record<string, string | undefined>;
}

export const sendEmailTemplate = async ({
  templateName,
  templateVars,
  to,
  subject,
}: SendEmailTemplateParams) => {
  const html = renderEmailTemplate(templateName, templateVars);
  await sendEmail({ html, to, subject });
};
