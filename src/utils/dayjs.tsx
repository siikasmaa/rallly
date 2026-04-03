import { format } from "date-fns";
import type { Locale } from "date-fns";
import { getLocale } from "@/paraglide/runtime";
import * as React from "react";
import { useAsync, useLocalStorage } from "react-use";

import { useRequiredContext } from "../components/use-required-context";

export type TimeFormat = "12h" | "24h";
export type StartOfWeek = "monday" | "sunday";

const dateFnsLocales: Record<
  string,
  {
    weekStartsOn: StartOfWeek;
    timeFormat: TimeFormat;
    import: () => Promise<{ default: Locale } | Locale>;
  }
> = {
  en: {
    weekStartsOn: "monday",
    timeFormat: "12h",
    import: () => import("date-fns/locale/en-US"),
  },
  es: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/es"),
  },
  da: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/da"),
  },
  de: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/de"),
  },
  fr: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/fr"),
  },
  it: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/it"),
  },
  sv: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/sv"),
  },
  sk: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/sk"),
  },
  cs: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/cs"),
  },
  pl: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/pl"),
  },
  pt: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/pt"),
  },
  "pt-BR": {
    weekStartsOn: "sunday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/pt-BR"),
  },
  ko: {
    weekStartsOn: "sunday",
    timeFormat: "12h",
    import: () => import("date-fns/locale/ko"),
  },
  nl: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/nl"),
  },
  hu: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/hu"),
  },
  zh: {
    weekStartsOn: "monday",
    timeFormat: "24h",
    import: () => import("date-fns/locale/zh-CN"),
  },
};

interface DateContextValue {
  locale: Locale;
  weekStartsOn: StartOfWeek;
  timeFormat: TimeFormat;
  setWeekStartsOn: React.Dispatch<
    React.SetStateAction<StartOfWeek | undefined>
  >;
  setTimeFormat: React.Dispatch<React.SetStateAction<TimeFormat | undefined>>;
  /**
   * Format a date with the current locale.
   * Uses date-fns format tokens. For localized time, use "p" (12h/24h depends on locale/timeFormat setting).
   */
  formatDate: (date: Date | number, formatStr: string) => string;
  weekStartsOnIndex: 0 | 1;
}

const DateContext = React.createContext<DateContextValue | null>(null);

export const useDayjs = () => {
  return useRequiredContext(DateContext);
};

// Alias for a more descriptive name
export const useDateContext = useDayjs;

export const DayjsProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const currentLanguage = getLocale();

  const localeConfig = dateFnsLocales[currentLanguage] ?? dateFnsLocales.en;

  const [weekStartsOn = localeConfig.weekStartsOn, setWeekStartsOn] =
    useLocalStorage<StartOfWeek>("rallly-week-starts-on");

  const [timeFormat = localeConfig.timeFormat, setTimeFormat] =
    useLocalStorage<TimeFormat>("rallly-time-format");

  const { value: dateFnsLocale } = useAsync(async () => {
    const mod = await localeConfig.import();
    // Handle both default and named exports
    return "default" in mod ? mod.default : mod;
  }, [localeConfig]);

  const weekStartsOnIndex: 0 | 1 = weekStartsOn === "monday" ? 1 : 0;

  // Use the loaded locale, or fall back to a minimal default
  const effectiveLocale: Locale | undefined = dateFnsLocale;

  const formatDate = (date: Date | number, formatStr: string) => {
    try {
      return format(date, formatStr, {
        locale: effectiveLocale,
        weekStartsOn: weekStartsOnIndex,
      });
    } catch {
      return format(date, formatStr);
    }
  };

  return (
    <DateContext.Provider
      value={{
        locale: effectiveLocale,
        weekStartsOn: weekStartsOn ?? localeConfig.weekStartsOn,
        timeFormat: timeFormat ?? localeConfig.timeFormat,
        setWeekStartsOn,
        setTimeFormat,
        formatDate,
        weekStartsOnIndex,
      }}
    >
      {children}
    </DateContext.Provider>
  );
};

// Re-export DateProvider as an alias
export const DateProvider = DayjsProvider;
