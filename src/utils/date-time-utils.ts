import type { Option } from "@/db/schema";
import {
  differenceInHours,
  differenceInMinutes,
  format,
  isSameDay,
  parseISO,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

import {
  DateTimeOption,
  TimeOption,
} from "../components/forms/poll-options-form";

export const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

export const encodeDateOption = (option: DateTimeOption) => {
  return option.type === "timeSlot"
    ? `${option.start}/${option.end}`
    : option.date;
};

export interface ParsedDateOption {
  type: "date";
  optionId: string;
  day: string;
  dow: string;
  month: string;
  year: string;
}

export interface ParsedTimeSlotOption {
  type: "timeSlot";
  optionId: string;
  day: string;
  dow: string;
  month: string;
  startTime: string;
  endTime: string;
  duration: string;
  year: string;
}

export type ParsedDateTimeOpton = ParsedDateOption | ParsedTimeSlotOption;

const isTimeSlot = (value: string) => value.indexOf("/") !== -1;

export const getDuration = (startTime: Date, endTime: Date) => {
  const hours = Math.floor(differenceInHours(endTime, startTime));
  const minutes = Math.floor(
    differenceInMinutes(endTime, startTime) - hours * 60,
  );
  let res = "";
  if (hours) {
    res += `${hours}h`;
  }
  if (hours && minutes) {
    res += " ";
  }
  if (minutes) {
    res += `${minutes}m`;
  }
  return res;
};

export const decodeOptions = (
  options: Option[],
  timeZone: string | null,
  targetTimeZone: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _timeFormat: string, // TODO (Luke Vella) [2022-06-28]: Need to pass timeFormat so that we recalculate the options when timeFormat changes. There is definitely a better way to do this
):
  | { pollType: "date"; options: ParsedDateOption[] }
  | { pollType: "timeSlot"; options: ParsedTimeSlotOption[] } => {
  const pollType = isTimeSlot(options[0].value) ? "timeSlot" : "date";

  if (pollType === "timeSlot") {
    return {
      pollType,
      options: options.map((option) =>
        parseTimeSlotOption(option, timeZone, targetTimeZone),
      ),
    };
  } else {
    return {
      pollType,
      options: options.map((option) => parseDateOption(option)),
    };
  }
};

const parseDateOption = (option: Option): ParsedDateOption => {
  const dateString =
    option.value.indexOf("T") === -1
      ? // we add the time because otherwise Date will assume UTC time which might change the day for some time zones
        option.value + "T00:00:00"
      : option.value;
  const date = new Date(dateString);
  return {
    type: "date",
    optionId: option.id,
    day: format(date, "d"),
    dow: format(date, "EEE"),
    month: format(date, "MMM"),
    year: format(date, "yyyy"),
  };
};

/**
 * Convert a date from one timezone to another.
 * This replaces `dayjs(date).tz(timeZone, true).tz(targetTimeZone)`.
 *
 * The approach: treat `dateStr` as a wall-clock time in `timeZone`,
 * convert it to UTC, then get the wall-clock time in `targetTimeZone`.
 */
const convertTimeZone = (dateStr: string, fromTz: string, toTz: string): Date => {
  // Parse the date string as a local date
  const localDate = new Date(dateStr);

  // Get the offset in the source timezone by formatting
  // We use a trick: get the UTC representation of this wall-clock time in fromTz
  // by using toZonedTime in reverse
  const utcDate = new Date(
    localDate.getTime() -
      (toZonedTime(localDate, fromTz).getTime() - localDate.getTime()),
  );

  // Now convert UTC to target timezone
  return toZonedTime(utcDate, toTz);
};

const parseTimeSlotOption = (
  option: Option,
  timeZone: string | null,
  targetTimeZone: string,
): ParsedTimeSlotOption => {
  const [start, end] = option.value.split("/");

  const startDate =
    timeZone && targetTimeZone
      ? convertTimeZone(start, timeZone, targetTimeZone)
      : new Date(start);
  const endDate =
    timeZone && targetTimeZone
      ? convertTimeZone(end, timeZone, targetTimeZone)
      : new Date(end);

  return {
    type: "timeSlot",
    optionId: option.id,
    startTime: format(startDate, "p"),
    endTime: format(endDate, "p"),
    day: format(startDate, "d"),
    dow: format(startDate, "EEE"),
    month: format(startDate, "MMM"),
    duration: getDuration(startDate, endDate),
    year: format(startDate, "yyyy"),
  };
};

export const removeAllOptionsForDay = (
  options: DateTimeOption[],
  date: Date,
) => {
  return options.filter((option) => {
    return !isSameDay(
      date,
      new Date(option.type === "date" ? option.date : option.start),
    );
  });
};

export const getDateProps = (date: Date) => {
  return {
    day: format(date, "d"),
    dow: format(date, "EEE"),
    month: format(date, "MMM"),
  };
};

export const expectTimeOption = (d: DateTimeOption): TimeOption => {
  if (d.type === "date") {
    throw new Error("Expected timeSlot but got date instead");
  }
  return d;
};

export const parseValue = (value: string): DateTimeOption => {
  if (isTimeSlot(value)) {
    const [start, end] = value.split("/");
    return {
      type: "timeSlot",
      start,
      end,
    };
  } else {
    return {
      type: "date",
      date: value,
    };
  }
};
