import type { OperatingCalendar } from "../types";

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

export function parseDateKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

export function weekdayOf(dateKey: string): number {
  const { y, m, d } = parseDateKey(dateKey);
  return new Date(y, m - 1, d).getDay();
}

export function daysInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= last; d += 1) days.push(toDateKey(y, m - 1, d));
  return days;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function isoWeekStart(dateKey: string): string {
  const { y, m, d } = parseDateKey(dateKey);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

export function groupByWeek(days: string[]): string[][] {
  const weeks: string[][] = [];
  let current: string[] = [];
  let weekId = "";
  for (const day of days) {
    const start = isoWeekStart(day);
    if (start !== weekId) {
      if (current.length) weeks.push(current);
      current = [day];
      weekId = start;
    } else {
      current.push(day);
    }
  }
  if (current.length) weeks.push(current);
  return weeks;
}

export function isHoliday(date: string, holidayDates: Set<string>): boolean {
  return holidayDates.has(date);
}

export function processOperates(
  calendar: OperatingCalendar,
  date: string,
  holidayDates: Set<string>,
): boolean {
  const dow = weekdayOf(date);
  const holiday = holidayDates.has(date);
  if (calendar === "full_365") return true;
  if (calendar === "no_public_holidays") return !holiday;
  return dow !== 0 && !holiday;
}

export function weekdayShort(date: string): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekdayOf(date)];
}

export function weekdayName(dow: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dow];
}

export function statusLabel(status: string): string {
  switch (status) {
    case "work":
      return "Work";
    case "weekly_off":
      return "Weekly off";
    case "leave":
      return "Leave";
    case "comp_off":
      return "Comp-off";
    case "public_holiday":
      return "Holiday";
    case "not_required":
      return "Not required";
    default:
      return status;
  }
}
