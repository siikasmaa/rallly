/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type D1Database = import("@cloudflare/workers-types").D1Database;
type SendEmail = import("@cloudflare/workers-types").SendEmail;

type Runtime = import("@astrojs/cloudflare").Runtime<{
  DB: D1Database;
  SEND_EMAIL: SendEmail;
  SECRET_PASSWORD: string;
  API_SECRET: string;
  SUPPORT_EMAIL: string;
}>;

declare namespace App {
  interface Locals extends Runtime {
    locale: string;
  }
}

// Cloudflare Email Workers global
declare class EmailMessage {
  constructor(from: string, to: string, raw: string);
}
