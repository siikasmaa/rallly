import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    resolve: {
      alias: {
        "@/": new URL("./src/", import.meta.url).pathname,
        "~/": new URL("./", import.meta.url).pathname,
      },
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: [
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
    ],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
