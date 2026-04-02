import type { MiddlewareHandler } from "astro";
import languageParser from "accept-language-parser";

const supportedLocales = [
  "cs",
  "da",
  "de",
  "en",
  "es",
  "fr",
  "hu",
  "it",
  "ko",
  "nl",
  "pl",
  "pt-BR",
  "pt",
  "sk",
  "sv",
  "zh",
];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request } = context;

  // Locale detection: cookie -> Accept-Language -> default (en)
  const cookies = context.cookies;
  const localeCookie = cookies.get("NEXT_LOCALE")?.value;

  let detectedLocale = "en";
  if (localeCookie && supportedLocales.includes(localeCookie)) {
    detectedLocale = localeCookie;
  } else {
    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) {
      const parsed = languageParser.pick(supportedLocales, acceptLanguage);
      if (parsed) {
        detectedLocale = parsed;
      }
    }
  }

  // Store locale in context for use in pages
  context.locals.locale = detectedLocale;

  // Initialize D1 database binding from Cloudflare runtime
  const runtime = (context.locals as any).runtime;
  if (runtime?.env?.DB) {
    const { getDb } = await import("@/db");
    getDb(runtime.env.DB);
  }

  return next();
};
