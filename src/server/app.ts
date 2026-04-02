import { Elysia, t } from "elysia";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { subMinutes } from "date-fns";

import { getDb } from "@/db";
import {
  comments,
  options,
  participants,
  polls,
  users,
  votes,
} from "@/db/schema";
import type { VoteType } from "@/db/schema";
import { notDeleted, softDeletePoll } from "@/db/soft-delete";

import { absoluteUrl } from "../utils/absolute-url";
import { sendEmailTemplate, sendNotification } from "../utils/api-utils";
import {
  createGuestUser,
  createSessionCookie,
  createToken,
  decryptToken,
  getSessionCookieName,
  getSessionFromCookie,
  mergeGuestsIntoUser,
  type SessionData,
  type SessionUser,
} from "../utils/auth";
import { nanoid } from "../utils/nanoid";

import type { GetPollApiResponse } from "../utils/types";

// Helper to parse cookies from request
function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
}

// Helper to get pollId from admin URL ID
async function getPollIdFromAdminUrlId(urlId: string): Promise<string> {
  const db = getDb();
  const result = await db.query.polls.findFirst({
    columns: { id: true },
    where: and(eq(polls.adminUrlId, urlId), notDeleted()),
  });
  if (!result) {
    throw new Error("NOT_FOUND");
  }
  return result.id;
}

// Demo data
const demoParticipantData: Array<{ name: string; votes: VoteType[] }> = [
  { name: "Reed", votes: ["yes", "no", "ifNeedBe", "no"] },
  { name: "Susan", votes: ["yes", "yes", "yes", "no"] },
  { name: "Johnny", votes: ["no", "no", "yes", "yes"] },
  { name: "Ben", votes: ["yes", "yes", "yes", "yes"] },
];
const demoOptionValues = [
  "2022-12-14",
  "2022-12-15",
  "2022-12-16",
  "2022-12-17",
];

export const app = new Elysia({ prefix: "/api" })
  .derive(async ({ request }) => {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookies = parseCookies(cookieHeader);
    const cookieName = getSessionCookieName();
    const sessionData = await getSessionFromCookie(cookies[cookieName]);
    let user: SessionUser = sessionData?.user ?? (await createGuestUser());

    const session = {
      get user() {
        return user;
      },
      set user(newUser: SessionUser) {
        user = newUser;
      },
      _dirty: false,
      _destroyed: false,
      async save() {
        session._dirty = true;
      },
      destroy() {
        session._destroyed = true;
      },
    };

    return { session };
  })
  .onAfterHandle(async ({ session, set }) => {
    if (session._destroyed) {
      const cookieName = getSessionCookieName();
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      set.headers["Set-Cookie"] =
        `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
    } else if (session._dirty || session.user) {
      const cookie = await createSessionCookie({ user: session.user });
      set.headers["Set-Cookie"] = cookie;
    }
  })
  // --- Session routes ---
  .get(
    "/session/get",
    async ({ session }) => {
      if (session.user.isGuest) {
        return { isGuest: true as const, id: session.user.id };
      }

      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });

      if (!user) {
        session.user = await createGuestUser();
        await session.save();
        return { isGuest: true as const, id: session.user.id };
      }

      return {
        isGuest: false as const,
        id: user.id,
        email: user.email,
        name: user.name,
      };
    },
  )
  .post(
    "/session/destroy",
    async ({ session }) => {
      session.destroy();
      return { ok: true };
    },
  )
  // --- Login route ---
  .post(
    "/login",
    async ({ session, body }) => {
      const { email, path } = body;
      const homePageUrl = absoluteUrl();
      const user = session.user;

      const token = await createToken({
        email,
        guestId: user.id,
        path,
      });

      const loginUrl = `${homePageUrl}/login?code=${token}`;

      await sendEmailTemplate({
        templateName: "login",
        to: email,
        subject: "Rallly - Login",
        templateVars: {
          loginUrl,
          homePageUrl,
        },
      });

      return { ok: true };
    },
    {
      body: t.Object({
        email: t.String(),
        path: t.String(),
      }),
    },
  )
  // --- User routes ---
  .get(
    "/user/polls",
    async ({ session, error }) => {
      if (!session.user) {
        return error(401, "Unauthorized");
      }

      const db = getDb();
      const userPolls = await db.query.polls.findMany({
        where: (polls, { and, eq }) =>
          and(eq(polls.userId, session.user.id), notDeleted()),
        columns: {
          title: true,
          closed: true,
          verified: true,
          createdAt: true,
          adminUrlId: true,
        },
        orderBy: [desc(polls.createdAt)],
        limit: 10,
      });

      return { polls: userPolls };
    },
  )
  .post(
    "/user/change-name",
    async ({ body }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ name: body.name, updatedAt: new Date() })
        .where(eq(users.id, body.userId));
      return { ok: true };
    },
    {
      body: t.Object({
        userId: t.String(),
        name: t.String({ minLength: 1, maxLength: 100 }),
      }),
    },
  )
  // --- Polls routes ---
  .post(
    "/polls/create",
    async ({ session, body }): Promise<{ urlId: string }> => {
      const db = getDb();
      const adminUrlId = await nanoid();
      let verified = false;

      if (session.user.isGuest === false) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, session.user.id),
        });
        if (user?.email === body.user.email) {
          verified = true;
        }
      }

      // Upsert user: find or create
      let existingUser = await db.query.users.findFirst({
        where: eq(users.email, body.user.email),
      });

      if (!existingUser) {
        const userId = await nanoid();
        await db.insert(users).values({
          id: userId,
          name: body.user.name,
          email: body.user.email,
        });
        existingUser = {
          id: userId,
          name: body.user.name,
          email: body.user.email,
          createdAt: new Date(),
          updatedAt: null,
        };
      }

      const pollId = await nanoid();
      const participantUrlId = await nanoid();

      await db.insert(polls).values({
        id: pollId,
        title: body.title,
        type: body.type,
        timeZone: body.timeZone ?? null,
        location: body.location ?? null,
        description: body.description ?? null,
        authorName: body.user.name,
        demo: body.demo ?? false,
        verified,
        adminUrlId,
        participantUrlId,
        userId: existingUser.id,
      });

      // Create options
      if (body.options.length > 0) {
        const optionValues = await Promise.all(
          body.options.map(async (value: string) => ({
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
            to: body.user.email,
            subject: `Rallly: ${body.title}`,
            templateVars: {
              title: body.title,
              name: body.user.name,
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
            to: body.user.email,
            subject: `Rallly: ${body.title} - Verify your email address`,
            templateVars: {
              title: body.title,
              name: body.user.name,
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
    {
      body: t.Object({
        title: t.String(),
        type: t.Literal("date"),
        timeZone: t.Optional(t.String()),
        location: t.Optional(t.String()),
        description: t.Optional(t.String()),
        user: t.Object({
          name: t.String(),
          email: t.String(),
        }),
        options: t.Array(t.String()),
        demo: t.Optional(t.Boolean()),
      }),
    },
  )
  .get(
    "/polls/get",
    async ({ query, session, error }): Promise<GetPollApiResponse> => {
      const db = getDb();
      const admin = query.admin === "true";
      const condition = admin
        ? eq(polls.adminUrlId, query.urlId)
        : eq(polls.participantUrlId, query.urlId);

      const poll = await db.query.polls.findFirst({
        where: and(condition, notDeleted()),
        with: {
          options: { orderBy: [asc(options.value)] },
          user: true,
        },
      });

      if (!poll) {
        return error(404, "Poll not found");
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

      if (!admin && session.user?.id !== poll.user.id) {
        return { ...result, admin, adminUrlId: "" };
      }

      return { ...result, admin };
    },
    {
      query: t.Object({
        urlId: t.String(),
        admin: t.String(),
      }),
    },
  )
  .post(
    "/polls/update",
    async ({ body, error }): Promise<GetPollApiResponse> => {
      const db = getDb();
      let pollId: string;
      try {
        pollId = await getPollIdFromAdminUrlId(body.urlId);
      } catch {
        return error(404, "Poll not found");
      }

      if (body.optionsToDelete && body.optionsToDelete.length > 0) {
        await db
          .delete(options)
          .where(
            and(
              eq(options.pollId, pollId),
              inArray(options.id, body.optionsToDelete),
            ),
          );
      }

      if (body.optionsToAdd && body.optionsToAdd.length > 0) {
        const newOptions = await Promise.all(
          body.optionsToAdd.map(async (value: string) => ({
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
      if (body.title !== undefined) updateData.title = body.title;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.description !== undefined)
        updateData.description = body.description;
      if (body.timeZone !== undefined) updateData.timeZone = body.timeZone;
      if (body.notifications !== undefined)
        updateData.notifications = body.notifications;
      if (body.closed !== undefined) updateData.closed = body.closed;

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
        return error(404, "Poll not found");
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
    {
      body: t.Object({
        urlId: t.String(),
        title: t.Optional(t.String()),
        timeZone: t.Optional(t.String()),
        location: t.Optional(t.String()),
        description: t.Optional(t.String()),
        optionsToDelete: t.Optional(t.Array(t.String())),
        optionsToAdd: t.Optional(t.Array(t.String())),
        notifications: t.Optional(t.Boolean()),
        closed: t.Optional(t.Boolean()),
      }),
    },
  )
  .post(
    "/polls/delete",
    async ({ body, error }) => {
      let pollId: string;
      try {
        pollId = await getPollIdFromAdminUrlId(body.urlId);
      } catch {
        return error(404, "Poll not found");
      }
      await softDeletePoll(getDb(), pollId);
      return { ok: true };
    },
    {
      body: t.Object({
        urlId: t.String(),
      }),
    },
  )
  .post(
    "/polls/touch",
    async ({ body }) => {
      const db = getDb();
      await db
        .update(polls)
        .set({ touchedAt: new Date() })
        .where(eq(polls.id, body.pollId));
      return { ok: true };
    },
    {
      body: t.Object({
        pollId: t.String(),
      }),
    },
  )
  // --- Participants routes ---
  .get(
    "/polls/participants/list",
    async ({ query }) => {
      const db = getDb();
      const result = await db.query.participants.findMany({
        where: eq(participants.pollId, query.pollId),
        with: { votes: true },
        orderBy: [asc(participants.createdAt), desc(participants.name)],
      });
      return result;
    },
    {
      query: t.Object({
        pollId: t.String(),
      }),
    },
  )
  .post(
    "/polls/participants/add",
    async ({ session, body }) => {
      const db = getDb();
      const user = session.user;
      const participantId = await nanoid();

      await db.insert(participants).values({
        id: participantId,
        pollId: body.pollId,
        name: body.name,
        userId: user.id,
      });

      if (body.votes.length > 0) {
        const voteValues = await Promise.all(
          body.votes.map(async ({ optionId, type }: { optionId: string; type: VoteType }) => ({
            id: await nanoid(),
            optionId,
            type,
            pollId: body.pollId,
            participantId,
          })),
        );
        await db.insert(votes).values(voteValues);
      }

      const participant = await db.query.participants.findFirst({
        where: eq(participants.id, participantId),
        with: { votes: true },
      });

      await sendNotification(body.pollId, {
        type: "newParticipant",
        participantName: body.name,
      });

      return participant;
    },
    {
      body: t.Object({
        pollId: t.String(),
        name: t.String({ minLength: 1 }),
        votes: t.Array(
          t.Object({
            optionId: t.String(),
            type: t.Union([
              t.Literal("yes"),
              t.Literal("no"),
              t.Literal("ifNeedBe"),
            ]),
          }),
        ),
      }),
    },
  )
  .post(
    "/polls/participants/update",
    async ({ body }) => {
      const db = getDb();

      // Update participant name
      await db
        .update(participants)
        .set({ name: body.name, updatedAt: new Date() })
        .where(
          and(
            eq(participants.id, body.participantId),
            eq(participants.pollId, body.pollId),
          ),
        );

      // Delete existing votes for this participant in this poll
      await db
        .delete(votes)
        .where(
          and(
            eq(votes.participantId, body.participantId),
            eq(votes.pollId, body.pollId),
          ),
        );

      // Create new votes
      if (body.votes.length > 0) {
        const voteValues = await Promise.all(
          body.votes.map(async ({ optionId, type }: { optionId: string; type: VoteType }) => ({
            id: await nanoid(),
            optionId,
            type,
            pollId: body.pollId,
            participantId: body.participantId,
          })),
        );
        await db.insert(votes).values(voteValues);
      }

      const participant = await db.query.participants.findFirst({
        where: eq(participants.id, body.participantId),
        with: { votes: true },
      });

      return participant;
    },
    {
      body: t.Object({
        pollId: t.String(),
        participantId: t.String(),
        name: t.String(),
        votes: t.Array(
          t.Object({
            optionId: t.String(),
            type: t.Union([
              t.Literal("yes"),
              t.Literal("no"),
              t.Literal("ifNeedBe"),
            ]),
          }),
        ),
      }),
    },
  )
  .post(
    "/polls/participants/delete",
    async ({ body }) => {
      const db = getDb();
      await db
        .delete(participants)
        .where(
          and(
            eq(participants.id, body.participantId),
            eq(participants.pollId, body.pollId),
          ),
        );
      return { ok: true };
    },
    {
      body: t.Object({
        pollId: t.String(),
        participantId: t.String(),
      }),
    },
  )
  // --- Comments routes ---
  .get(
    "/polls/comments/list",
    async ({ query }) => {
      const db = getDb();
      return await db.query.comments.findMany({
        where: eq(comments.pollId, query.pollId),
        orderBy: [asc(comments.createdAt)],
      });
    },
    {
      query: t.Object({
        pollId: t.String(),
      }),
    },
  )
  .post(
    "/polls/comments/add",
    async ({ session, body }) => {
      const db = getDb();
      const user = session.user;
      const commentId = await nanoid();

      await db.insert(comments).values({
        id: commentId,
        content: body.content,
        pollId: body.pollId,
        authorName: body.authorName,
        userId: user.id,
      });

      const newComment = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
      });

      await sendNotification(body.pollId, {
        type: "newComment",
        authorName: body.authorName,
      });

      return newComment;
    },
    {
      body: t.Object({
        pollId: t.String(),
        authorName: t.String(),
        content: t.String(),
      }),
    },
  )
  .post(
    "/polls/comments/delete",
    async ({ body }) => {
      const db = getDb();
      await db
        .delete(comments)
        .where(
          and(eq(comments.id, body.commentId), eq(comments.pollId, body.pollId)),
        );
      return { ok: true };
    },
    {
      body: t.Object({
        pollId: t.String(),
        commentId: t.String(),
      }),
    },
  )
  // --- Verification routes ---
  .post(
    "/polls/verification/verify",
    async ({ session, body, error }) => {
      const db = getDb();
      let decoded: { pollId: string };
      try {
        decoded = await decryptToken<{ pollId: string }>(body.code);
      } catch {
        return error(400, "Invalid or expired verification code");
      }

      if (decoded.pollId !== body.pollId) {
        return error(
          400,
          `Poll id in token (${decoded.pollId}) did not match: ${body.pollId}`,
        );
      }

      await db
        .update(polls)
        .set({ verified: true, updatedAt: new Date() })
        .where(eq(polls.id, decoded.pollId));

      const poll = await db.query.polls.findFirst({
        where: eq(polls.id, decoded.pollId),
        with: { user: true },
      });

      if (!poll) {
        return error(404, "Poll not found");
      }

      if (session.user?.isGuest) {
        await mergeGuestsIntoUser(poll.user.id, [session.user.id]);
      }

      session.user = {
        id: poll.user.id,
        isGuest: false,
      };
      await session.save();

      return { ok: true };
    },
    {
      body: t.Object({
        pollId: t.String(),
        code: t.String(),
      }),
    },
  )
  .post(
    "/polls/verification/request",
    async ({ body, error }) => {
      const db = getDb();
      const poll = await db.query.polls.findFirst({
        where: and(eq(polls.id, body.pollId), notDeleted()),
        with: { user: true },
      });

      if (!poll) {
        return error(404, `Poll with id ${body.pollId} not found`);
      }

      const homePageUrl = absoluteUrl();
      const pollUrl = `${homePageUrl}/admin/${body.adminUrlId}`;
      const token = await createToken({ pollId: body.pollId });
      const verifyEmailUrl = `${pollUrl}?code=${token}`;

      await sendEmailTemplate({
        templateName: "new-poll",
        to: poll.user.email,
        subject: `Rallly: ${poll.title} - Verify your email address`,
        templateVars: {
          title: poll.title,
          name: poll.user.name,
          pollUrl,
          verifyEmailUrl,
          homePageUrl,
          supportEmail: process.env.SUPPORT_EMAIL,
        },
      });

      return { ok: true };
    },
    {
      body: t.Object({
        pollId: t.String(),
        adminUrlId: t.String(),
      }),
    },
  )
  // --- Demo route ---
  .post(
    "/polls/demo/create",
    async () => {
      const db = getDb();
      const adminUrlId = await nanoid();
      const demoUser = { name: "John Example", email: "noreply@rallly.co" };

      // Upsert demo user
      let existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, demoUser.email),
      });

      if (!existingUser) {
        const userId = await nanoid();
        await db.insert(users).values({
          id: userId,
          ...demoUser,
        });
        existingUser = {
          id: userId,
          ...demoUser,
          createdAt: new Date(),
          updatedAt: null,
        };
      }

      const pollId = await nanoid();
      const participantUrlId = await nanoid();

      // Create poll
      await db.insert(polls).values({
        id: pollId,
        title: "Lunch Meeting",
        type: "date",
        location: "Starbucks, 901 New York Avenue",
        description:
          "Hey everyone, please choose the dates when you are available to meet for our monthly get together. Looking forward to see you all!",
        authorName: "Johnny",
        verified: true,
        demo: true,
        adminUrlId,
        participantUrlId,
        userId: existingUser.id,
      });

      // Create options
      const optionRecords: Array<{ id: string; value: string }> = [];
      for (const value of demoOptionValues) {
        optionRecords.push({ id: await nanoid(), value });
      }
      await db.insert(options).values(
        optionRecords.map((o) => ({ ...o, pollId })),
      );

      // Create participants and votes
      const participantRecords: Array<{
        id: string;
        name: string;
        userId: string;
        pollId: string;
        createdAt: Date;
      }> = [];
      const voteRecords: Array<{
        id: string;
        optionId: string;
        participantId: string;
        pollId: string;
        type: VoteType;
      }> = [];

      for (let i = 0; i < demoParticipantData.length; i++) {
        const { name, votes: participantVotes } = demoParticipantData[i];
        const participantId = await nanoid();
        participantRecords.push({
          id: participantId,
          name,
          userId: "user-demo",
          pollId,
          createdAt: subMinutes(new Date(), i),
        });

        for (let j = 0; j < optionRecords.length; j++) {
          voteRecords.push({
            id: await nanoid(),
            optionId: optionRecords[j].id,
            participantId,
            pollId,
            type: participantVotes[j],
          });
        }
      }

      await db.insert(participants).values(participantRecords);
      await db.insert(votes).values(voteRecords);

      return adminUrlId;
    },
  );

export type App = typeof app;
