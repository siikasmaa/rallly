import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const usersRelations = relations(users, ({ many }) => ({
  polls: many(polls),
}));

// Polls table
export const polls = sqliteTable(
  "polls",
  {
    id: text("id").primaryKey(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    deadline: integer("deadline", { mode: "timestamp" }),
    title: text("title").notNull(),
    type: text("type", { enum: ["date"] }).notNull(),
    description: text("description"),
    location: text("location"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    timeZone: text("time_zone"),
    authorName: text("author_name").notNull().default(""),
    demo: integer("demo", { mode: "boolean" }).notNull().default(false),
    legacy: integer("legacy", { mode: "boolean" }).notNull().default(false),
    closed: integer("closed", { mode: "boolean" }).notNull().default(false),
    notifications: integer("notifications", { mode: "boolean" })
      .notNull()
      .default(false),
    deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
    touchedAt: integer("touched_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    participantUrlId: text("participant_url_id").notNull().unique(),
    adminUrlId: text("admin_url_id").notNull().unique(),
  },
  (table) => [
    index("polls_user_id_idx").on(table.userId),
  ],
);

export const pollsRelations = relations(polls, ({ one, many }) => ({
  user: one(users, {
    fields: [polls.userId],
    references: [users.id],
  }),
  options: many(options),
  participants: many(participants),
  votes: many(votes),
  comments: many(comments),
}));

// Options table
export const options = sqliteTable(
  "options",
  {
    id: text("id").primaryKey(),
    value: text("value").notNull(),
    pollId: text("poll_id")
      .notNull()
      .references(() => polls.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [
    index("options_poll_id_idx").on(table.pollId),
  ],
);

export const optionsRelations = relations(options, ({ one, many }) => ({
  poll: one(polls, {
    fields: [options.pollId],
    references: [polls.id],
  }),
  votes: many(votes),
}));

// Participants table
export const participants = sqliteTable(
  "participants",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id"),
    pollId: text("poll_id")
      .notNull()
      .references(() => polls.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [
    index("participants_poll_id_idx").on(table.pollId),
    uniqueIndex("participants_id_poll_id_idx").on(table.id, table.pollId),
  ],
);

export const participantsRelations = relations(
  participants,
  ({ one, many }) => ({
    poll: one(polls, {
      fields: [participants.pollId],
      references: [polls.id],
    }),
    votes: many(votes),
  }),
);

// Votes table
export const votes = sqliteTable(
  "votes",
  {
    id: text("id").primaryKey(),
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    optionId: text("option_id")
      .notNull()
      .references(() => options.id, { onDelete: "cascade" }),
    pollId: text("poll_id")
      .notNull()
      .references(() => polls.id),
    type: text("type", { enum: ["yes", "no", "ifNeedBe"] })
      .notNull()
      .default("yes"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [
    index("votes_participant_id_idx").on(table.participantId),
    index("votes_poll_id_idx").on(table.pollId),
  ],
);

export const votesRelations = relations(votes, ({ one }) => ({
  participant: one(participants, {
    fields: [votes.participantId],
    references: [participants.id],
  }),
  option: one(options, {
    fields: [votes.optionId],
    references: [options.id],
  }),
  poll: one(polls, {
    fields: [votes.pollId],
    references: [polls.id],
  }),
}));

// Comments table
export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    pollId: text("poll_id")
      .notNull()
      .references(() => polls.id),
    authorName: text("author_name").notNull(),
    userId: text("user_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [
    index("comments_poll_id_idx").on(table.pollId),
    uniqueIndex("comments_id_poll_id_idx").on(table.id, table.pollId),
  ],
);

export const commentsRelations = relations(comments, ({ one }) => ({
  poll: one(polls, {
    fields: [comments.pollId],
    references: [polls.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;
export type Option = typeof options.$inferSelect;
export type NewOption = typeof options.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type VoteType = "yes" | "no" | "ifNeedBe";
