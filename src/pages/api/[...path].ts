import type { APIRoute } from "astro";

import { app } from "@/server/app";

const handler: APIRoute = async ({ request }) => {
  try {
    return await app.handle(request);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error("[API Error]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
