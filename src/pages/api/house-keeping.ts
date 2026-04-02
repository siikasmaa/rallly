import dayjs from "dayjs";
import { and, asc, eq, inArray, lte, or, sql } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";

import { getDb } from "@/db";
import { comments, options, participants, polls, votes } from "@/db/schema";

import { parseValue } from "../../utils/date-time-utils";

/**
 * DANGER: This endpoint will permanently delete polls.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
    return;
  }

  const { authorization } = req.headers;

  if (authorization !== `Bearer ${process.env.API_SECRET}`) {
    res.status(401).json({ success: false });
    return;
  }

  const db = getDb();

  // Get polls that have not been accessed for over 30 days
  const inactivePolls = await db
    .select({
      id: polls.id,
      maxValue: sql<string>`MAX(${options.value})`.as("max_value"),
    })
    .from(polls)
    .innerJoin(options, eq(options.pollId, polls.id))
    .where(
      and(
        lte(polls.touchedAt, dayjs().add(-30, "days").toDate()),
        eq(polls.deleted, false),
      ),
    )
    .groupBy(polls.id);

  const pollsToSoftDelete: string[] = [];

  // Keep polls that have options in the future
  inactivePolls.forEach(({ id, maxValue }) => {
    const parsedValue = parseValue(maxValue);
    const date =
      parsedValue.type === "date" ? parsedValue.date : parsedValue.end;

    if (dayjs(date).isBefore(dayjs())) {
      pollsToSoftDelete.push(id);
    }
  });

  let softDeletedCount = 0;
  if (pollsToSoftDelete.length > 0) {
    const result = await db
      .update(polls)
      .set({ deleted: true, deletedAt: new Date() })
      .where(inArray(polls.id, pollsToSoftDelete));
    softDeletedCount = pollsToSoftDelete.length;
  }

  // Permanently delete old demos and polls that have been soft deleted for 7 days
  const pollsToDelete = await db.query.polls.findMany({
    where: or(
      and(
        eq(polls.deleted, true),
        lte(polls.deletedAt, dayjs().add(-7, "days").toDate()),
      ),
      and(
        eq(polls.demo, true),
        lte(polls.createdAt, dayjs().add(-1, "days").toDate()),
      ),
    ),
    columns: { id: true },
    orderBy: [asc(polls.createdAt)],
  });

  const pollIdsToDelete = pollsToDelete.map(({ id }) => id);

  if (pollIdsToDelete.length !== 0) {
    // Delete in order: comments, votes, participants, options, polls
    await db
      .delete(comments)
      .where(inArray(comments.pollId, pollIdsToDelete));
    await db.delete(votes).where(inArray(votes.pollId, pollIdsToDelete));
    await db
      .delete(participants)
      .where(inArray(participants.pollId, pollIdsToDelete));
    await db.delete(options).where(inArray(options.pollId, pollIdsToDelete));
    // Hard delete polls (bypassing soft delete)
    await db.delete(polls).where(inArray(polls.id, pollIdsToDelete));
  }

  res.status(200).json({
    softDeleted: softDeletedCount,
    deleted: pollIdsToDelete.length,
  });
}
