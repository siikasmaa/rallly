import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { APIRoute } from "astro";

import { createContext } from "../../../server/context";
import { createRouter } from "../../../server/createRouter";
import { login } from "../../../server/routers/login";
import { polls } from "../../../server/routers/polls";
import { session } from "../../../server/routers/session";
import { user } from "../../../server/routers/user";
import superjson from "superjson";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("session.", session)
  .merge("polls.", polls)
  .merge(login)
  .merge("user.", user);

export type AppRouter = typeof appRouter;

const handler: APIRoute = async ({ request }) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
  });
};

export const GET = handler;
export const POST = handler;
