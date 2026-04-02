/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type D1Database = import("@cloudflare/workers-types").D1Database;

type Runtime = import("@astrojs/cloudflare").Runtime<{
  DB: D1Database;
  SECRET_PASSWORD: string;
  API_SECRET: string;
  SUPPORT_EMAIL: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_SECURE: string;
  SMTP_USER: string;
  SMTP_PWD: string;
}>;

declare namespace App {
  interface Locals extends Runtime {
    locale: string;
  }
}
