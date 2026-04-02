import type { APIRoute } from "astro";

import { app } from "@/server/app";

const handler: APIRoute = async ({ request }) => {
  return app.handle(request);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
