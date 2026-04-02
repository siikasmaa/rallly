import { and, eq } from "drizzle-orm";

import { type Database } from "./index";
import { polls } from "./schema";

/**
 * Soft-delete a poll by setting deleted = true and deletedAt = now.
 * Replaces the Prisma soft-delete middleware behavior.
 */
export async function softDeletePoll(db: Database, pollId: string) {
  return db
    .update(polls)
    .set({ deleted: true, deletedAt: new Date() })
    .where(eq(polls.id, pollId));
}

/**
 * Soft-delete multiple polls.
 */
export async function softDeletePolls(db: Database, pollIds: string[]) {
  if (pollIds.length === 0) return;
  const { inArray } = await import("drizzle-orm");
  return db
    .update(polls)
    .set({ deleted: true, deletedAt: new Date() })
    .where(inArray(polls.id, pollIds));
}

/**
 * Base condition for non-deleted polls.
 * Use this in all poll queries to replicate the soft-delete middleware filter.
 */
export function notDeleted() {
  return eq(polls.deleted, false);
}

/**
 * Find a single poll by a unique field, excluding soft-deleted.
 */
export async function findPollWhere(
  db: Database,
  condition: ReturnType<typeof eq>,
) {
  const result = await db.query.polls.findFirst({
    where: and(condition, notDeleted()),
  });
  return result ?? null;
}
