import dayjs from "dayjs";

import { getDb } from "@/db";
import { options, participants, polls, users, votes } from "@/db/schema";
import type { VoteType } from "@/db/schema";

import { nanoid } from "../../../utils/nanoid";
import { createRouter } from "../../createRouter";

const participantData: Array<{ name: string; votes: VoteType[] }> = [
  {
    name: "Reed",
    votes: ["yes", "no", "ifNeedBe", "no"],
  },
  {
    name: "Susan",
    votes: ["yes", "yes", "yes", "no"],
  },
  {
    name: "Johnny",
    votes: ["no", "no", "yes", "yes"],
  },
  {
    name: "Ben",
    votes: ["yes", "yes", "yes", "yes"],
  },
];

const optionValues = ["2022-12-14", "2022-12-15", "2022-12-16", "2022-12-17"];

export const demo = createRouter().mutation("create", {
  resolve: async () => {
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
      existingUser = { id: userId, ...demoUser, createdAt: new Date(), updatedAt: null };
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
    for (const value of optionValues) {
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

    for (let i = 0; i < participantData.length; i++) {
      const { name, votes: participantVotes } = participantData[i];
      const participantId = await nanoid();
      participantRecords.push({
        id: participantId,
        name,
        userId: "user-demo",
        pollId,
        createdAt: dayjs()
          .add(i * -1, "minutes")
          .toDate(),
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
});
