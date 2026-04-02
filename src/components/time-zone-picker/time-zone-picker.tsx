import {
  flip,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from "@floating-ui/react-dom-interactions";
import { Combobox } from "@headlessui/react";
import clsx from "clsx";
import { format as formatTz } from "date-fns-tz";
import React from "react";

import ChevronDown from "../../components/icons/chevron-down.svg";
import { styleMenuItem } from "../menu-styles";
import timeZones from "./time-zones.json";

interface TimeZoneOption {
  value: string;
  label: string;
  offset: number;
}

/**
 * Get the numeric UTC offset (in hours) for a given IANA timezone.
 */
const getTimezoneOffset = (tz: string): number => {
  try {
    const now = new Date();
    // Format the offset string, e.g. "+05:30" or "-08:00"
    const offsetStr = formatTz(now, "xxx", { timeZone: tz });
    const match = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    return sign * (hours + minutes / 60);
  } catch {
    return 0;
  }
};

const useTimeZones = () => {
  const options = React.useMemo(() => {
    return Object.entries(timeZones)
      .reduce<TimeZoneOption[]>((selectOptions, [tzId, displayName]) => {
        const tzOffset = getTimezoneOffset(tzId);

        const totalMinutes = tzOffset * 60;
        const hrs = Math.trunc(totalMinutes / 60);
        const mins = Math.abs(totalMinutes % 60);
        const hrStr = `${hrs}:${mins === 0 ? "00" : mins}`;
        const prefix = `(GMT${hrStr.startsWith("-") ? hrStr : `+${hrStr}`}) ${displayName}`;

        selectOptions.push({
          value: tzId,
          label: prefix,
          offset: tzOffset,
        });

        return selectOptions;
      }, [])
      .sort((a: TimeZoneOption, b: TimeZoneOption) => a.offset - b.offset);
  }, []);

  const findFuzzyTz = React.useCallback(
    (zone: string): TimeZoneOption => {
      const zoneOffset = getTimezoneOffset(zone);
      const zoneLower = zone.toLowerCase();

      // Find timezones with the same offset, then score by string matching
      const matches = options
        .filter((tz) => tz.offset === zoneOffset)
        .map((tz) => {
          let score = 0;
          const afterSlash = zoneLower.substring(zoneLower.indexOf("/") + 1);
          const beforeSlash = zoneLower.substring(0, zoneLower.indexOf("/"));

          if (tz.value.toLowerCase().includes(afterSlash)) {
            score += 8;
          }
          if (tz.label.toLowerCase().includes(afterSlash)) {
            score += 4;
          }
          if (tz.value.toLowerCase().includes(beforeSlash)) {
            score += 2;
          }
          score += 1;
          return { tz, score };
        })
        .sort((a, b) => b.score - a.score);

      return matches.length > 0
        ? matches[0].tz
        : options[0];
    },
    [options],
  );

  return React.useMemo(
    () => ({
      options,
      findFuzzyTz,
    }),
    [findFuzzyTz, options],
  );
};

const TimeZonePicker: React.VoidFunctionComponent<{
  value: string;
  onChange: (tz: string) => void;
  onBlur?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}> = ({ value, onChange, onBlur, className, style, disabled }) => {
  const { options, findFuzzyTz } = useTimeZones();

  const { reference, floating, x, y, strategy, refs } = useFloating({
    strategy: "fixed",
    middleware: [
      offset(5),
      flip(),
      size({
        apply: ({ reference }) => {
          if (refs.floating.current) {
            Object.assign(refs.floating.current.style, {
              width: `${reference.width}px`,
            });
          }
        },
      }),
    ],
  });

  const timeZoneOptions = React.useMemo(
    () => [
      {
        value: "",
        label: "Ignore time zone",
        offset: 0,
      },
      ...options,
    ],
    [options],
  );

  const selectedTimeZone = React.useMemo(
    () =>
      value
        ? timeZoneOptions.find(
            (timeZoneOption) => timeZoneOption.value === value,
          ) ?? findFuzzyTz(value)
        : timeZoneOptions[0],
    [findFuzzyTz, timeZoneOptions, value],
  );

  const [query, setQuery] = React.useState("");

  const filteredTimeZones = React.useMemo(() => {
    if (!query) return timeZoneOptions;
    const lowerQuery = query.toLowerCase();
    return timeZoneOptions.filter((tz) => {
      // Match against the label (which includes the display name)
      if (tz.label.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Also match against the IANA timezone ID
      if (tz.value.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      return false;
    });
  }, [timeZoneOptions, query]);

  return (
    <Combobox
      value={selectedTimeZone}
      onChange={(newTimeZone) => {
        setQuery("");
        onChange(newTimeZone.value);
      }}
      disabled={disabled}
    >
      <div
        className={clsx("relative", className)}
        ref={reference}
        style={style}
      >
        {/* Remove generic params once Combobox.Input can infer the types */}
        <Combobox.Input<"input", TimeZoneOption>
          className="input w-full pr-8"
          displayValue={() => ""}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onBlur={onBlur}
        />
        <Combobox.Button className="absolute inset-0 flex h-9 w-full cursor-default items-center px-2 text-left">
          <span className="grow truncate">
            {!query ? selectedTimeZone.label : null}
          </span>
          <span className="pointer-events-none flex">
            <ChevronDown className="h-5 w-5" />
          </span>
        </Combobox.Button>
        <FloatingPortal>
          <Combobox.Options
            ref={floating}
            className="z-50 mt-1 max-h-72 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            style={{
              position: strategy,
              left: x ?? "",
              top: y ?? "",
            }}
          >
            {filteredTimeZones.map((timeZone) => (
              <Combobox.Option
                key={timeZone.value}
                className={styleMenuItem}
                value={timeZone}
              >
                {timeZone.label}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </FloatingPortal>
      </div>
    </Combobox>
  );
};

export default TimeZonePicker;
