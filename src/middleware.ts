import type { MiddlewareHandler } from "astro";

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
  try {
    const { request } = context;

    // Locale detection: cookie -> Accept-Language -> default (en)
    const localeCookie = context.cookies.get("NEXT_LOCALE")?.value;

    let detectedLocale = "en";
    if (localeCookie && supportedLocales.includes(localeCookie)) {
      detectedLocale = localeCookie;
    } else {
      const acceptLanguage = request.headers.get("accept-language");
      if (acceptLanguage) {
        // Simple Accept-Language parsing without external dependency
        const preferred = acceptLanguage
          .split(",")
          .map((part) => {
            const [lang, q] = part.trim().split(";q=");
            return { lang: lang.trim(), q: q ? parseFloat(q) : 1.0 };
          })
          .sort((a, b) => b.q - a.q);

        for (const { lang } of preferred) {
          const match = supportedLocales.find(
            (l) => l === lang || l === lang.split("-")[0],
          );
          if (match) {
            detectedLocale = match;
            break;
          }
        }
      }
    }

    // Store locale in context for use in pages
    context.locals.locale = detectedLocale;

    // Initialize bindings from Cloudflare runtime
    const runtime = (context.locals as any).runtime;
    if (runtime?.env) {
      if (runtime.env.DB) {
        const { getDb } = await import("@/db");
        getDb(runtime.env.DB);
      }
      if (runtime.env.SEND_EMAIL) {
        const { initEmail } = await import("@/utils/send-email");
        initEmail(runtime.env.SEND_EMAIL);
      }
    }
  } catch (e) {
    console.error("Middleware error:", e);
  }

  return next();
};
