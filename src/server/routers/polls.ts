import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { options, polls, users } from "@/db/schema";
import { notDeleted, softDeletePoll } from "@/db/soft-delete";

import { absoluteUrl } from "../../utils/absolute-url";
import { sendEmailTemplate } from "../../utils/api-utils";
import { createToken } from "../../utils/auth";
import { nanoid } from "../../utils/nanoid";
import { GetPollApiResponse } from "../../utils/trpc/types";
import { createRouter } from "../createRouter";
import { comments } from "./polls/comments";
import { demo } from "./polls/demo";
import { participants } from "./polls/participants";
import { verification } from "./polls/verification";

const getPollIdFromAdminUrlId = async (urlId: string) => {
  const db = getDb();
  const result = await db.query.polls.findFirst({
    columns: { id: true },
    where: and(eq(polls.adminUrlId, urlId), notDeleted()),
  });

  if (!result) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return result.id;
};

export const pollsRoute = createRouter()
  .merge("demo.", demo)
  .merge("participants.", participants)
  .merge("comments.", comments)
  .merge("verification.", verification)
  .mutation("create", {
    input: z.object({
      title: z.string(),
      type: z.literal("date"),
      timeZone: z.string().optional(),
      location: z.string().optional(),
      description: z.string().optional(),
      user: z.object({
        name: z.string(),
        email: z.string(),
      }),
      options: z.string().array(),
      demo: z.boolean().optional(),
    }),
    resolve: async ({ ctx, input }): Promise<{ urlId: string }> => {
      const db = getDb();
      const adminUrlId = await nanoid();
      let verified = false;

      if (ctx.session.user.isGuest === false) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, ctx.session.user.id),
        });
        if (user?.email === input.user.email) {
          verified = true;
        }
      }

      // Upsert user: find or create
      let existingUser = await db.query.users.findFirst({
        where: eq(users.email, input.user.email),
      });

      if (!existingUser) {
        const userId = await nanoid();
        await db.insert(users).values({
          id: userId,
          name: input.user.name,
          email: input.user.email,
        });
        existingUser = { id: userId, name: input.user.name, email: input.user.email, createdAt: new Date(), updatedAt: null };
      }

      const pollId = await nanoid();
      const participantUrlId = await nanoid();

      await db.insert(polls).values({
        id: pollId,
        title: input.title,
        type: input.type,
        timeZone: input.timeZone ?? null,
        location: input.location ?? null,
        description: input.description ?? null,
        authorName: input.user.name,
        demo: input.demo ?? false,
        verified,
        adminUrlId,
        participantUrlId,
        userId: existingUser.id,
      });

      // Create options
      if (input.options.length > 0) {
        const optionValues = await Promise.all(
          input.options.map(async (value) => ({
            id: await nanoid(),
            value,
            pollId,
          })),
        );
        await db.insert(options).values(optionValues);
      }

      const homePageUrl = absoluteUrl();
      const pollUrl = `${homePageUrl}/admin/${adminUrlId}`;

      try {
        if (verified) {
          await sendEmailTemplate({
            templateName: "new-poll-verified",
            to: input.user.email,
            subject: `Rallly: ${input.title}`,
            templateVars: {
              title: input.title,
              name: input.user.name,
              pollUrl,
              homePageUrl,
              supportEmail: process.env.SUPPORT_EMAIL,
            },
          });
        } else {
          const verificationCode = await createToken({ pollId });
          const verifyEmailUrl = `${pollUrl}?code=${verificationCode}`;

          await sendEmailTemplate({
            templateName: "new-poll",
            to: input.user.email,
            subject: `Rallly: ${input.title} - Verify your email address`,
            templateVars: {
              title: input.title,
              name: input.user.name,
              pollUrl,
              verifyEmailUrl,
              homePageUrl,
              supportEmail: process.env.SUPPORT_EMAIL,
            },
          });
        }
      } catch (e) {
        console.error(e);
      }

      return { urlId: adminUrlId };
    },
  })
  .query("get", {
    input: z.object({
      urlId: z.string(),
      admin: z.boolean(),
    }),
    resolve: async ({ input, ctx }): Promise<GetPollApiResponse> => {
      const db = getDb();
      const condition = input.admin
        ? eq(polls.adminUrlId, input.urlId)
        : eq(polls.participantUrlId, input.urlId);

      const poll = await db.query.polls.findFirst({
        where: and(condition, notDeleted()),
        with: {
          options: { orderBy: [asc(options.value)] },
          user: true,
        },
      });

      if (!poll) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const result = {
        id: poll.id,
        timeZone: poll.timeZone,
        title: poll.title,
        authorName: poll.authorName,
        location: poll.location,
        description: poll.description,
        createdAt: poll.createdAt,
        participantUrlId: poll.participantUrlId,
        adminUrlId: poll.adminUrlId,
        verified: poll.verified,
        closed: poll.closed,
        legacy: poll.legacy,
        demo: poll.demo,
        notifications: poll.notifications,
        options: poll.options,
        user: poll.user,
      };

      if (!input.admin && ctx.session.user?.id !== poll.user.id) {
        return { ...result, admin: input.admin, adminUrlId: "" };
      }

      return { ...result, admin: input.admin };
    },
  })
  .mutation("update", {
    input: z.object({
      urlId: z.string(),
      title: z.string().optional(),
      timeZone: z.string().optional(),
      location: z.string().optional(),
      description: z.string().optional(),
      optionsToDelete: z.string().array().optional(),
      optionsToAdd: z.string().array().optional(),
      notifications: z.boolean().optional(),
      closed: z.boolean().optional(),
    }),
    resolve: async ({ input }): Promise<GetPollApiResponse> => {
      const db = getDb();
      const pollId = await getPollIdFromAdminUrlId(input.urlId);

      if (input.optionsToDelete && input.optionsToDelete.length > 0) {
        const { inArray } = await import("drizzle-orm");
        await db
          .delete(options)
          .where(
            and(
              eq(options.pollId, pollId),
              inArray(options.id, input.optionsToDelete),
            ),
          );
      }

      if (input.optionsToAdd && input.optionsToAdd.length > 0) {
        const newOptions = await Promise.all(
          input.optionsToAdd.map(async (value) => ({
            id: await nanoid(),
            value,
            pollId,
          })),
        );
        await db.insert(options).values(newOptions);
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.timeZone !== undefined) updateData.timeZone = input.timeZone;
      if (input.notifications !== undefined)
        updateData.notifications = input.notifications;
      if (input.closed !== undefined) updateData.closed = input.closed;

      await db.update(polls).set(updateData).where(eq(polls.id, pollId));

      // Fetch updated poll
      const poll = await db.query.polls.findFirst({
        where: eq(polls.id, pollId),
        with: {
          options: { orderBy: [asc(options.value)] },
          user: true,
        },
      });

      if (!poll) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        id: poll.id,
        timeZone: poll.timeZone,
        title: poll.title,
        authorName: poll.authorName,
        location: poll.location,
        description: poll.description,
        createdAt: poll.createdAt,
        participantUrlId: poll.participantUrlId,
        adminUrlId: poll.adminUrlId,
        verified: poll.verified,
        closed: poll.closed,
        legacy: poll.legacy,
        demo: poll.demo,
        notifications: poll.notifications,
        options: poll.options,
        user: poll.user,
        admin: true,
      };
    },
  })
  .mutation("delete", {
    input: z.object({
      urlId: z.string(),
    }),
    resolve: async ({ input: { urlId } }) => {
      const pollId = await getPollIdFromAdminUrlId(urlId);
      await softDeletePoll(getDb(), pollId);
    },
  })
  .mutation("touch", {
    input: z.object({
      pollId: z.string(),
    }),
    resolve: async ({ input: { pollId } }) => {
      const db = getDb();
      await db
        .update(polls)
        .set({ touchedAt: new Date() })
        .where(eq(polls.id, pollId));
    },
  });

// Re-export as "polls" for backward compatibility with router merging
export { pollsRoute as polls };
