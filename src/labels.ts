import type { AppState, CellStatus, OperatingCalendar } from "./types";
import { weekdayName } from "./engine/calendar";

export const CALENDAR_LABEL: Record<OperatingCalendar, string> = {
  full_365: "365-day (Sundays + holidays on)",
  no_public_holidays: "Daily except public holidays",
  no_sundays_or_holidays: "Sundays and public holidays off",
};

export const STATUS_SHORT: Record<CellStatus, string> = {
  work: "W",
  weekly_off: "WO",
  leave: "L",
  comp_off: "CO",
  public_holiday: "PH",
  not_required: "NR",
};

export function empName(state: AppState, id: string): string {
  return state.employees.find((e) => e.id === id)?.name ?? id;
}

export function brandName(state: AppState, id: string): string {
  return state.brands.find((b) => b.id === id)?.name ?? id;
}

export function procCode(state: AppState, id: string): string {
  return state.processes.find((p) => p.id === id)?.code ?? id;
}

export function podName(state: AppState, id: string): string {
  return state.pods.find((p) => p.id === id)?.name ?? id;
}

export function preferredOffLabel(dow: number): string {
  return weekdayName(dow).slice(0, 3);
}

export function employeeBrands(state: AppState, employeeId: string): string {
  const ids = [...new Set(state.assignments.filter((a) => a.employeeId === employeeId).map((a) => a.brandId))];
  return ids.map((id) => brandName(state, id)).join(", ") || "Backup bench";
}
