import {
  addDays,
  addMonths,
  format,
  getDay,
  getMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import React from "react";

import { useDayjs } from "../utils/dayjs";

interface DayProps {
  date: Date;
  day: string;
  weekend: boolean;
  outOfMonth: boolean;
  today: boolean;
  selected: boolean;
}

interface HeadlessDatePickerOptions {
  onSelectionChange?: (selection: Date[]) => void;
  date?: Date;
  selection?: Date[];
  onNavigationChange?: (date: Date) => void;
  weekStartsOn?: "monday" | "sunday";
}

const today = new Date();

export const useHeadlessDatePicker = (
  options?: HeadlessDatePickerOptions,
): {
  label: string;
  next: () => void;
  prev: () => void;
  today: () => void;
  daysOfWeek: string[];
  days: DayProps[];
  navigationDate: Date;
  selection: Date[];
  toggle: (date: Date) => void;
} => {
  const { locale, weekStartsOnIndex, formatDate } = useDayjs();
  const [localSelection, setSelection] = React.useState<Date[]>([]);
  const selection = options?.selection ?? localSelection;
  const [localNavigationDate, setNavigationDate] = React.useState(today);
  const navigationDate = options?.date ?? localNavigationDate;

  const firstDayOfMonth = startOfMonth(navigationDate);
  const firstDayOfFirstWeek = startOfWeek(firstDayOfMonth, {
    weekStartsOn: weekStartsOnIndex,
  });

  const currentMonth = getMonth(navigationDate);

  const days: DayProps[] = [];

  const daysOfWeek: string[] = [];

  for (let i = 0; i < 7; i++) {
    daysOfWeek.push(formatDate(addDays(firstDayOfFirstWeek, i), "EEEEEE"));
  }

  let reachedEnd = false;
  let i = 0;
  do {
    const d = addDays(firstDayOfFirstWeek, i);
    const dayOfWeek = getDay(d);
    days.push({
      date: d,
      day: format(d, "d"),
      weekend: dayOfWeek === 0 || dayOfWeek === 6,
      outOfMonth: getMonth(d) !== currentMonth,
      today: isSameDay(d, today),
      selected: selection.some((selectedDate) => isSameDay(d, selectedDate)),
    });
    i++;
    reachedEnd =
      i > 34 && i % 7 === 0 && getMonth(addDays(d, 1)) !== currentMonth;
  } while (reachedEnd === false);

  return {
    navigationDate,
    label: formatDate(navigationDate, "MMMM yyyy"),
    next: () => {
      const newDate = startOfMonth(addMonths(navigationDate, 1));
      if (!options?.date) {
        setNavigationDate(newDate);
      }
      options?.onNavigationChange?.(newDate);
    },
    prev: () => {
      const newDate = startOfMonth(addMonths(navigationDate, -1));
      if (!options?.date) {
        setNavigationDate(newDate);
      }
      options?.onNavigationChange?.(newDate);
    },
    today: () => {
      const newDate = today;
      if (!options?.date) {
        setNavigationDate(newDate);
      }
      options?.onNavigationChange?.(newDate);
    },
    days,
    daysOfWeek,
    selection: options?.selection ?? selection,
    toggle: (date) => {
      if (options?.selection) {
        // ignore, selection is controlled externally
        return;
      }
      const index = selection.indexOf(date);
      if (index === -1) {
        setSelection((s) => [...s, date]);
      } else {
        setSelection((s) => s.splice(index, 1));
      }
    },
  };
};
