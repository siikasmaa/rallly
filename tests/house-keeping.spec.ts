import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { eq, inArray } from "drizzle-orm";

import { getDb } from "../src/db";
import {
  comments,
  options,
  participants,
  polls,
  votes,
} from "../src/db/schema";

/**
 * House keeping policy:
 * * Demo polls are hard deleted after one day
 * * Polls are soft deleted after 30 days of inactivity
 * * Soft deleted polls are hard deleted after 7 days of being soft deleted
 */
test.beforeAll(async ({ request, baseURL }) => {
  const db = getDb();

  await db.insert(polls).values([
    // Active Poll
    {
      title: "Active Poll",
      id: "active-poll",
      type: "date",
      userId: "user1",
      participantUrlId: "p1",
      adminUrlId: "a1",
    },
    // Poll that has been deleted 6 days ago
    {
      title: "Deleted poll",
      id: "deleted-poll-6d",
      type: "date",
      userId: "user1",
      deleted: true,
      deletedAt: dayjs().add(-6, "days").toDate(),
      participantUrlId: "p2",
      adminUrlId: "a2",
    },
    // Poll that has been deleted 7 days ago
    {
      title: "Deleted poll 7d",
      id: "deleted-poll-7d",
      type: "date",
      userId: "user1",
      deleted: true,
      deletedAt: dayjs().add(-7, "days").toDate(),
      participantUrlId: "p3",
      adminUrlId: "a3",
    },
    // Poll that has been inactive for 29 days
    {
      title: "Still active",
      id: "still-active-poll",
      type: "date",
      userId: "user1",
      touchedAt: dayjs().add(-29, "days").toDate(),
      participantUrlId: "p4",
      adminUrlId: "a4",
    },
    // Poll that has been inactive for 30 days
    {
      title: "Inactive poll",
      id: "inactive-poll",
      type: "date",
      userId: "user1",
      touchedAt: dayjs().add(-30, "days").toDate(),
      participantUrlId: "p5",
      adminUrlId: "a5",
    },
    // Demo poll
    {
      demo: true,
      title: "Demo poll",
      id: "demo-poll-new",
      type: "date",
      userId: "user1",
      createdAt: new Date(),
      participantUrlId: "p6",
      adminUrlId: "a6",
    },
    {
      demo: true,
      title: "Old demo poll",
      id: "demo-poll-old",
      type: "date",
      userId: "user1",
      createdAt: dayjs().add(-2, "days").toDate(),
      participantUrlId: "p7",
      adminUrlId: "a7",
    },
    {
      title: "Inactive poll with future option",
      id: "inactive-poll-future-option",
      type: "date",
      userId: "user1",
      touchedAt: dayjs().add(-30, "days").toDate(),
      participantUrlId: "p8",
      adminUrlId: "a8",
    },
  ]);

  await db.insert(options).values([
    {
      id: "option-1",
      value: "2022-02-22",
      pollId: "deleted-poll-7d",
    },
    {
      id: "option-2",
      value: "2022-02-23",
      pollId: "deleted-poll-7d",
    },
    {
      id: "option-3",
      value: "2022-02-24",
      pollId: "deleted-poll-7d",
    },
    {
      id: "option-4",
      value: `${dayjs()
        .add(10, "days")
        .format("YYYY-MM-DDTHH:mm:ss")}/${dayjs()
        .add(10, "days")
        .add(1, "hour")
        .format("YYYY-MM-DDTHH:mm:ss")}`,
      pollId: "inactive-poll-future-option",
    },
    {
      id: "option-5",
      value: dayjs().add(-1, "days").format("YYYY-MM-DD"),
      pollId: "inactive-poll",
    },
  ]);

  await db.insert(participants).values({
    id: "participant-1",
    name: "Luke",
    pollId: "deleted-poll-7d",
  });

  await db.insert(votes).values([
    {
      id: "vote-1",
      optionId: "option-1",
      type: "yes",
      participantId: "participant-1",
      pollId: "deleted-poll-7d",
    },
    {
      id: "vote-2",
      optionId: "option-2",
      type: "no",
      participantId: "participant-1",
      pollId: "deleted-poll-7d",
    },
    {
      id: "vote-3",
      optionId: "option-3",
      type: "yes",
      participantId: "participant-1",
      pollId: "deleted-poll-7d",
    },
  ]);

  // call house-keeping endpoint
  const res = await request.post(`${baseURL}/api/house-keeping`, {
    headers: {
      Authorization: `Bearer ${process.env.API_SECRET}`,
    },
  });

  expect(await res.json()).toMatchObject({
    softDeleted: 1,
    deleted: 2,
  });
});

test("should keep active polls", async () => {
  const db = getDb();
  const poll = await db.query.polls.findFirst({
    where: eq(polls.id, "active-poll"),
  });

  expect(poll).not.toBeNull();
  expect(poll?.deleted).toBeFalsy();
});

test("should keep polls that have been soft deleted for less than 7 days", async () => {
  const db = getDb();
  const deletedPoll6d = await db.query.polls.findFirst({
    where: eq(polls.id, "deleted-poll-6d"),
  });

  expect(deletedPoll6d).not.toBeNull();
});

test("should hard delete polls that have been soft deleted for 7 days", async () => {
  const db = getDb();
  const deletedPoll7d = await db.query.polls.findFirst({
    where: eq(polls.id, "deleted-poll-7d"),
  });

  expect(deletedPoll7d).toBeUndefined();

  const participantResults = await db.query.participants.findMany({
    where: eq(participants.pollId, "deleted-poll-7d"),
  });

  expect(participantResults.length).toBe(0);

  const voteResults = await db.query.votes.findMany({
    where: eq(votes.pollId, "deleted-poll-7d"),
  });

  expect(voteResults.length).toBe(0);

  const optionResults = await db.query.options.findMany({
    where: eq(options.pollId, "deleted-poll-7d"),
  });

  expect(optionResults.length).toBe(0);
});

test("should keep polls that are still active", async () => {
  const db = getDb();
  const stillActivePoll = await db.query.polls.findFirst({
    where: eq(polls.id, "still-active-poll"),
  });

  expect(stillActivePoll).not.toBeUndefined();
  expect(stillActivePoll?.deleted).toBeFalsy();
});

test("should soft delete polls that are inactive", async () => {
  const db = getDb();
  const inactivePoll = await db.query.polls.findFirst({
    where: eq(polls.id, "inactive-poll"),
  });

  expect(inactivePoll).not.toBeUndefined();
  expect(inactivePoll?.deleted).toBeTruthy();
  expect(inactivePoll?.deletedAt).toBeTruthy();
});

test("should keep new demo poll", async () => {
  const db = getDb();
  const demoPoll = await db.query.polls.findFirst({
    where: eq(polls.id, "demo-poll-new"),
  });

  expect(demoPoll).not.toBeUndefined();
});

test("should delete old demo poll", async () => {
  const db = getDb();
  const oldDemoPoll = await db.query.polls.findFirst({
    where: eq(polls.id, "demo-poll-old"),
  });

  expect(oldDemoPoll).toBeUndefined();
});

test("should not delete poll that has options in the future", async () => {
  const db = getDb();
  const futureOptionPoll = await db.query.polls.findFirst({
    where: eq(polls.id, "inactive-poll-future-option"),
  });

  expect(futureOptionPoll).not.toBeUndefined();
});

// Teardown
test.afterAll(async () => {
  const db = getDb();
  const pollIds = [
    "active-poll",
    "deleted-poll-6d",
    "deleted-poll-7d",
    "still-active-poll",
    "inactive-poll",
    "demo-poll-new",
    "demo-poll-old",
    "inactive-poll-future-option",
  ];

  await db.delete(votes).where(inArray(votes.pollId, pollIds));
  await db.delete(participants).where(inArray(participants.pollId, pollIds));
  await db.delete(options).where(inArray(options.pollId, pollIds));
  await db.delete(polls).where(inArray(polls.id, pollIds));
});
