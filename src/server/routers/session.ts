import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";

import { createGuestUser } from "../../utils/auth";
import { createRouter } from "../createRouter";

export const session = createRouter()
  .query("get", {
    async resolve({
      ctx,
    }): Promise<
      | { isGuest: true; id: string }
      | { isGuest: false; id: string; name: string; email: string }
    > {
      if (ctx.session.user.isGuest) {
        return { isGuest: true, id: ctx.session.user.id };
      }

      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });

      if (!user) {
        ctx.session.user = await createGuestUser();
        await ctx.session.save();
        return { isGuest: true, id: ctx.session.user.id };
      }

      return {
        isGuest: false,
        id: user.id,
        email: user.email,
        name: user.name,
      };
    },
  })
  .mutation("destroy", {
    async resolve({ ctx }) {
      ctx.session.destroy();
    },
  });
