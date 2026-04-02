import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { comments } from "@/db/schema";

import { nanoid } from "../../../utils/nanoid";
import { sendNotification } from "../../../utils/api-utils";
import { createRouter } from "../../createRouter";

export const commentsRoute = createRouter()
  .query("list", {
    input: z.object({
      pollId: z.string(),
    }),
    resolve: async ({ input: { pollId } }) => {
      const db = getDb();
      return await db.query.comments.findMany({
        where: eq(comments.pollId, pollId),
        orderBy: [asc(comments.createdAt)],
      });
    },
  })
  .mutation("add", {
    input: z.object({
      pollId: z.string(),
      authorName: z.string(),
      content: z.string(),
    }),
    resolve: async ({ ctx, input: { pollId, authorName, content } }) => {
      const db = getDb();
      const user = ctx.session.user;
      const commentId = await nanoid();

      await db.insert(comments).values({
        id: commentId,
        content,
        pollId,
        authorName,
        userId: user.id,
      });

      const newComment = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
      });

      await sendNotification(pollId, {
        type: "newComment",
        authorName,
      });

      return newComment;
    },
  })
  .mutation("delete", {
    input: z.object({
      pollId: z.string(),
      commentId: z.string(),
    }),
    resolve: async ({ input: { pollId, commentId } }) => {
      const db = getDb();
      await db
        .delete(comments)
        .where(
          and(eq(comments.id, commentId), eq(comments.pollId, pollId)),
        );
    },
  });

export { commentsRoute as comments };
