import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { IronSessionData } from "iron-session";
import { z } from "zod";

import { getDb } from "@/db";
import { polls, users } from "@/db/schema";
import { notDeleted } from "@/db/soft-delete";

import { createRouter } from "../createRouter";

const requireUser = (user: IronSessionData["user"]) => {
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Tried to access user route without a session",
    });
  }
  return user;
};

export const user = createRouter()
  .query("getPolls", {
    resolve: async ({ ctx }) => {
      const sessionUser = requireUser(ctx.session.user);
      const db = getDb();

      const userPolls = await db.query.polls.findMany({
        where: (polls, { and, eq }) =>
          and(eq(polls.userId, sessionUser.id), notDeleted()),
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
  })
  .mutation("changeName", {
    input: z.object({
      userId: z.string(),
      name: z.string().min(1).max(100),
    }),
    resolve: async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
    },
  });
