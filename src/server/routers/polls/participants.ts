import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { participants, votes } from "@/db/schema";

import { nanoid } from "../../../utils/nanoid";
import { sendNotification } from "../../../utils/api-utils";
import { createRouter } from "../../createRouter";

export const participantsRoute = createRouter()
  .query("list", {
    input: z.object({
      pollId: z.string(),
    }),
    resolve: async ({ input: { pollId } }) => {
      const db = getDb();
      const result = await db.query.participants.findMany({
        where: eq(participants.pollId, pollId),
        with: { votes: true },
        orderBy: [asc(participants.createdAt), desc(participants.name)],
      });
      return result;
    },
  })
  .mutation("delete", {
    input: z.object({
      pollId: z.string(),
      participantId: z.string(),
    }),
    resolve: async ({ input: { participantId, pollId } }) => {
      const db = getDb();
      await db
        .delete(participants)
        .where(
          and(
            eq(participants.id, participantId),
            eq(participants.pollId, pollId),
          ),
        );
    },
  })
  .mutation("add", {
    input: z.object({
      pollId: z.string(),
      name: z.string().nonempty("Participant name is required"),
      votes: z
        .object({
          optionId: z.string(),
          type: z.enum(["yes", "no", "ifNeedBe"]),
        })
        .array(),
    }),
    resolve: async ({ ctx, input: { pollId, votes: voteInputs, name } }) => {
      const db = getDb();
      const user = ctx.session.user;
      const participantId = await nanoid();

      await db.insert(participants).values({
        id: participantId,
        pollId,
        name,
        userId: user.id,
      });

      if (voteInputs.length > 0) {
        const voteValues = await Promise.all(
          voteInputs.map(async ({ optionId, type }) => ({
            id: await nanoid(),
            optionId,
            type,
            pollId,
            participantId,
          })),
        );
        await db.insert(votes).values(voteValues);
      }

      const participant = await db.query.participants.findFirst({
        where: eq(participants.id, participantId),
        with: { votes: true },
      });

      await sendNotification(pollId, {
        type: "newParticipant",
        participantName: name,
      });

      return participant;
    },
  })
  .mutation("update", {
    input: z.object({
      pollId: z.string(),
      participantId: z.string(),
      name: z.string(),
      votes: z
        .object({
          optionId: z.string(),
          type: z.enum(["yes", "no", "ifNeedBe"]),
        })
        .array(),
    }),
    resolve: async ({
      input: { pollId, participantId, votes: voteInputs, name },
    }) => {
      const db = getDb();

      // Update participant name
      await db
        .update(participants)
        .set({ name, updatedAt: new Date() })
        .where(
          and(
            eq(participants.id, participantId),
            eq(participants.pollId, pollId),
          ),
        );

      // Delete existing votes for this participant in this poll
      await db
        .delete(votes)
        .where(
          and(
            eq(votes.participantId, participantId),
            eq(votes.pollId, pollId),
          ),
        );

      // Create new votes
      if (voteInputs.length > 0) {
        const voteValues = await Promise.all(
          voteInputs.map(async ({ optionId, type }) => ({
            id: await nanoid(),
            optionId,
            type,
            pollId,
            participantId,
          })),
        );
        await db.insert(votes).values(voteValues);
      }

      const participant = await db.query.participants.findFirst({
        where: eq(participants.id, participantId),
        with: { votes: true },
      });

      return participant;
    },
  });

export { participantsRoute as participants };
