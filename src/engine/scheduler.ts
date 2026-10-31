import { emptyRoster } from "../data/seed";
import type {
  AppState,
  Assignment,
  BackupCandidate,
  BackupCover,
  BrandProcess,
  CellStatus,
  Employee,
  Issue,
  Roster,
  RosterCell,
} from "../types";
import {
  daysInMonth,
  groupByWeek,
  processOperates,
  weekdayName,
  weekdayOf,
} from "./calendar";

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function holidaySet(state: AppState): Set<string> {
  return new Set(state.holidays.map((h) => h.date));
}

function approvedLeaveMap(state: AppState): Map<string, "leave" | "comp_off"> {
  const map = new Map<string, "leave" | "comp_off">();
  for (const leave of state.leaves) {
    if (leave.status !== "approved") continue;
    map.set(`${leave.employeeId}:${leave.date}`, leave.type === "comp_off" ? "comp_off" : "leave");
  }
  return map;
}

export function minStaffFor(bp: BrandProcess, date: string, holidays: Set<string>): number {
  if (holidays.has(date)) return bp.minStaffHoliday;
  if (weekdayOf(date) === 0) return bp.minStaffSunday;
  return bp.minStaffWeekday;
}

export function operatingBrandProcesses(
  state: AppState,
  date: string,
  holidays: Set<string>,
): BrandProcess[] {
  return state.brandProcesses.filter((bp) => processOperates(bp.calendar, date, holidays));
}

function cellKey(employeeId: string, date: string): string {
  return `${employeeId}:${date}`;
}

function employeeHasOperatingWork(
  state: AppState,
  employeeId: string,
  date: string,
  holidays: Set<string>,
): boolean {
  return state.assignments.some((a) => {
    if (a.employeeId !== employeeId) return false;
    const bp = state.brandProcesses.find(
      (x) => x.brandId === a.brandId && x.processId === a.processId,
    );
    return bp ? processOperates(bp.calendar, date, holidays) : false;
  });
}

function allAssignmentsHolidayOff(
  state: AppState,
  employeeId: string,
  date: string,
  holidays: Set<string>,
): boolean {
  const assigned = state.assignments.filter((a) => a.employeeId === employeeId);
  if (!assigned.length) return holidays.has(date);
  if (!holidays.has(date)) return false;
  return assigned.every((a) => {
    const bp = state.brandProcesses.find(
      (x) => x.brandId === a.brandId && x.processId === a.processId,
    );
    return bp ? !processOperates(bp.calendar, date, holidays) : true;
  });
}

export function coverageCount(
  state: AppState,
  roster: Roster,
  date: string,
  brandId: string,
  processId: string,
): { count: number; workers: string[] } {
  const assigned = new Set(
    state.assignments
      .filter((a) => a.brandId === brandId && a.processId === processId)
      .map((a) => a.employeeId),
  );
  const workers = new Set<string>();
  for (const cell of roster.cells) {
    if (cell.date !== date || cell.status !== "work") continue;
    if (assigned.has(cell.employeeId)) workers.add(cell.employeeId);
  }
  for (const cover of roster.backups) {
    if (
      cover.date === date &&
      cover.brandId === brandId &&
      cover.processId === processId
    ) {
      const cell = roster.cells.find(
        (c) => c.employeeId === cover.employeeId && c.date === date,
      );
      if (isFreeForCover(cell?.status) || cell?.status === "work") workers.add(cover.employeeId);
    }
  }
  return { count: workers.size, workers: [...workers] };
}

function isFreeForCover(status: CellStatus | undefined): boolean {
  return status === "work" || status === "not_required" || status === "public_holiday";
}

export function suggestBackups(
  state: AppState,
  roster: Roster,
  date: string,
  brandId: string,
  processId: string,
  limit = 4,
): BackupCandidate[] {
  const already = new Set(coverageCount(state, roster, date, brandId, processId).workers);
  const processSkill = new Set(
    state.assignments.filter((a) => a.processId === processId).map((a) => a.employeeId),
  );
  const brandPodIds = new Set(
    state.assignments
      .filter((a) => a.brandId === brandId)
      .map((a) => state.employees.find((e) => e.id === a.employeeId)?.podId)
      .filter(Boolean) as string[],
  );

  const scored: { employeeId: string; score: number; reason: string }[] = [];
  for (const emp of state.employees) {
    if (!emp.active || already.has(emp.id)) continue;
    const cell = roster.cells.find((c) => c.employeeId === emp.id && c.date === date);
    if (!isFreeForCover(cell?.status)) continue;
    let score = 10;
    const reasons: string[] = [];
    if (emp.role === "floater" || emp.role === "pod_lead") {
      score += 8;
      reasons.push(emp.role === "pod_lead" ? "pod lead / backup" : "floater");
    }
    if (processSkill.has(emp.id)) {
      score += 6;
      reasons.push(`already works ${state.processes.find((p) => p.id === processId)?.code ?? "this process"}`);
    }
    if (brandPodIds.has(emp.podId)) {
      score += 4;
      reasons.push("same pod");
    }
    const ownLoad = state.assignments.filter((a) => a.employeeId === emp.id).length;
    if (ownLoad === 0) {
      score += 5;
      reasons.push("no dedicated brand");
    } else if (ownLoad <= 2) {
      score += 2;
    }
    scored.push({
      employeeId: emp.id,
      score,
      reason: reasons.join(" · ") || "available and working that day",
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ employeeId, reason }) => ({ employeeId, reason }));
}

function criticalProcessesForEmployee(
  state: AppState,
  employeeId: string,
  date: string,
  holidays: Set<string>,
): BrandProcess[] {
  return state.assignments
    .filter((a) => a.employeeId === employeeId)
    .map((a) =>
      state.brandProcesses.find((bp) => bp.brandId === a.brandId && bp.processId === a.processId),
    )
    .filter((bp): bp is BrandProcess => !!bp && processOperates(bp.calendar, date, holidays));
}

function wouldCreateGap(
  state: AppState,
  roster: Roster,
  employeeId: string,
  date: string,
  holidays: Set<string>,
): BrandProcess[] {
  const gaps: BrandProcess[] = [];
  const trial: Roster = {
    ...roster,
    cells: roster.cells.map((c) =>
      c.employeeId === employeeId && c.date === date ? { ...c, status: "weekly_off" } : c,
    ),
  };
  for (const bp of criticalProcessesForEmployee(state, employeeId, date, holidays)) {
    const need = minStaffFor(bp, date, holidays);
    if (need <= 0) continue;
    const { count } = coverageCount(state, trial, date, bp.brandId, bp.processId);
    if (count < need) gaps.push(bp);
  }
  return gaps;
}

function findBackupForGaps(
  state: AppState,
  roster: Roster,
  date: string,
  gaps: BrandProcess[],
  exclude: Set<string>,
): { covers: BackupCover[]; used: string[] } | null {
  const covers: BackupCover[] = [];
  const used: string[] = [];
  const taken = new Set(exclude);
  for (const bp of gaps) {
    const candidates = suggestBackups(state, roster, date, bp.brandId, bp.processId, 8).filter(
      (c) => !taken.has(c.employeeId),
    );
    const pick = candidates[0];
    if (!pick) return null;
    taken.add(pick.employeeId);
    used.push(pick.employeeId);
    covers.push({
      id: uid("bk"),
      date,
      employeeId: pick.employeeId,
      brandId: bp.brandId,
      processId: bp.processId,
      reason: `Cover while primary is off · ${pick.reason}`,
      auto: true,
    });
  }
  return { covers, used };
}

function restStatus(
  state: AppState,
  employeeId: string,
  date: string,
  holidays: Set<string>,
): CellStatus {
  if (allAssignmentsHolidayOff(state, employeeId, date, holidays)) return "public_holiday";
  if (!employeeHasOperatingWork(state, employeeId, date, holidays)) return "not_required";
  return "work";
}

export function generateRoster(state: AppState, month: string, preserveManual: boolean): Roster {
  const holidays = holidaySet(state);
  const leaves = approvedLeaveMap(state);
  const days = daysInMonth(month);
  const previous = state.roster.month === month ? state.roster : emptyRoster(month);
  const manual = new Map<string, RosterCell>();
  if (preserveManual) {
    for (const cell of previous.cells) {
      if (cell.manual) manual.set(cellKey(cell.employeeId, cell.date), cell);
    }
  }

  const cells: RosterCell[] = [];
  const cellMap = new Map<string, RosterCell>();
  const employees = state.employees.filter((e) => e.active);

  for (const emp of employees) {
    for (const date of days) {
      const key = cellKey(emp.id, date);
      const locked = manual.get(key);
      if (locked) {
        cells.push(locked);
        cellMap.set(key, locked);
        continue;
      }
      const leave = leaves.get(key);
      let status: CellStatus;
      let note = "";
      if (leave) {
        status = leave;
        note = leave === "comp_off" ? "Approved comp-off" : "Approved leave";
      } else {
        status = "work";
      }
      const cell: RosterCell = { employeeId: emp.id, date, status, manual: false, note };
      cells.push(cell);
      cellMap.set(key, cell);
    }
  }

  let roster: Roster = {
    month,
    status: "draft",
    generatedAt: new Date().toISOString(),
    cells,
    backups: [],
    issues: [],
  };

  const offLoad = new Map<string, number>();
  const weekOffGranted = new Map<string, number>();
  const weeks = groupByWeek(days);

  const flexibility = (emp: Employee): number => {
    const assigned = state.assignments.filter((a) => a.employeeId === emp.id);
    const calendars = assigned
      .map((a) =>
        state.brandProcesses.find((bp) => bp.brandId === a.brandId && bp.processId === a.processId),
      )
      .filter(Boolean);
    const has365 = calendars.some((bp) => bp?.calendar === "full_365");
    const uniqueBrands = new Set(assigned.map((a) => a.brandId)).size;
    let flex = 10;
    if (has365) flex -= 4;
    if (uniqueBrands === 1 && assigned.length >= 2) flex -= 3;
    if (emp.role === "floater" || emp.role === "pod_lead") flex += 4;
    return flex;
  };

  const ordered = [...employees].sort((a, b) => flexibility(a) - flexibility(b));

  for (const week of weeks) {
    const offCountByDay = new Map<string, number>();
    for (const emp of ordered) {
      const candidates = week.filter((date) => {
        const cell = cellMap.get(cellKey(emp.id, date));
        if (!cell) return false;
        if (cell.manual) return false;
        if (cell.status === "leave" || cell.status === "comp_off") return false;
        return true;
      });
      if (!candidates.length) continue;

      const scored = candidates.map((date) => {
        let score = 0;
        if (weekdayOf(date) === emp.preferredWeeklyOff) score += 12;
        const already = offCountByDay.get(date) ?? 0;
        score -= already * 3;
        const load = offLoad.get(date) ?? 0;
        score -= load;
        const gaps = wouldCreateGap(state, roster, emp.id, date, holidays);
        if (gaps.length) score -= 20;
        if (roster.backups.some((b) => b.employeeId === emp.id && b.date === date)) score -= 50;
        return { date, score, gaps };
      });
      scored.sort((a, b) => b.score - a.score);

      let chosen: { date: string; gaps: BrandProcess[] } | null = null;
      let covers: BackupCover[] = [];
      for (const option of scored) {
        if (roster.backups.some((b) => b.employeeId === emp.id && b.date === option.date)) continue;
        if (option.gaps.length === 0) {
          chosen = option;
          covers = [];
          break;
        }
        const found = findBackupForGaps(
          state,
          roster,
          option.date,
          option.gaps,
          new Set([emp.id]),
        );
        if (found) {
          chosen = option;
          covers = found.covers;
          break;
        }
      }

      if (!chosen) continue;

      const cell = cellMap.get(cellKey(emp.id, chosen.date));
      if (!cell) continue;
      cell.status = "weekly_off";
      cell.note = `Weekly off (preferred ${weekdayName(emp.preferredWeeklyOff)})`;
      offCountByDay.set(chosen.date, (offCountByDay.get(chosen.date) ?? 0) + 1);
      offLoad.set(chosen.date, (offLoad.get(chosen.date) ?? 0) + 1);
      weekOffGranted.set(emp.id, (weekOffGranted.get(emp.id) ?? 0) + 1);
      roster = { ...roster, backups: [...roster.backups, ...covers] };
    }
  }

  for (const cell of roster.cells) {
    if (cell.manual || cell.status !== "work") continue;
    const covering = roster.backups.some(
      (b) => b.employeeId === cell.employeeId && b.date === cell.date,
    );
    if (covering) continue;
    if (employeeHasOperatingWork(state, cell.employeeId, cell.date, holidays)) continue;
    cell.status = restStatus(state, cell.employeeId, cell.date, holidays);
  }

  roster.issues = validateRoster(state, roster);
  return roster;
}

export function validateRoster(state: AppState, roster: Roster): Issue[] {
  const holidays = holidaySet(state);
  const days = daysInMonth(roster.month);
  const issues: Issue[] = [];
  const holidayNames = new Map(state.holidays.map((h) => [h.date, h.name]));

  const nameOf = (id: string) => state.employees.find((e) => e.id === id)?.name ?? id;
  const brandOf = (id: string) => state.brands.find((b) => b.id === id)?.name ?? id;
  const procOf = (id: string) => state.processes.find((p) => p.id === id)?.code ?? id;

  for (const date of days) {
    for (const bp of state.brandProcesses) {
      if (!processOperates(bp.calendar, date, holidays)) continue;
      const need = minStaffFor(bp, date, holidays);
      if (need <= 0) continue;
      const { count, workers } = coverageCount(state, roster, date, bp.brandId, bp.processId);
      if (count >= need) continue;
      const assigned = state.assignments.filter(
        (a) => a.brandId === bp.brandId && a.processId === bp.processId,
      );
      const unavailable = assigned.map((a) => {
        const cell = roster.cells.find((c) => c.employeeId === a.employeeId && c.date === date);
        return `${nameOf(a.employeeId)} (${cell?.status ?? "unscheduled"})`;
      });
      const candidates = suggestBackups(state, roster, date, bp.brandId, bp.processId);
      const hol = holidayNames.get(date);
      issues.push({
        id: uid("iss"),
        severity: "error",
        category: "coverage",
        date,
        brandId: bp.brandId,
        processId: bp.processId,
        title: `${brandOf(bp.brandId)} ${procOf(bp.processId)} uncovered`,
        detail: `Needs ${need} on ${date}${hol ? ` (${hol})` : ""}; ${count} available. Assigned: ${unavailable.join(", ") || "none"}. Working: ${workers.map(nameOf).join(", ") || "none"}.`,
        suggestion:
          candidates.length > 0
            ? `Assign backup cover from ${candidates.map((c) => nameOf(c.employeeId)).join(", ")}.`
            : "No working backup is free. Add a floater assignment, cancel leave, or move a weekly off.",
        backupCandidates: candidates,
      });
    }
  }

  const weeks = groupByWeek(days);
  for (const emp of state.employees.filter((e) => e.active)) {
    let offs = 0;
    let prefHits = 0;
    const assigned = state.assignments.filter((a) => a.employeeId === emp.id);
    for (const week of weeks) {
      const hasOff = week.some((date) => {
        const cell = roster.cells.find((c) => c.employeeId === emp.id && c.date === date);
        return cell?.status === "weekly_off";
      });
      if (hasOff) offs += 1;
      else if (week.some((date) => employeeHasOperatingWork(state, emp.id, date, holidays))) {
        issues.push({
          id: uid("iss"),
          severity: "warning",
          category: "preference",
          employeeId: emp.id,
          date: week[0],
          title: `${nameOf(emp.id)} has no weekly off this week`,
          detail: `Coverage requirements blocked a weekly off in the week of ${week[0]}. Client coverage is treated as mandatory; weekly off is a preference.`,
          suggestion: "Add backup cover on one required day, then grant a weekly off.",
        });
      }
    }
    for (const cell of roster.cells) {
      if (cell.employeeId !== emp.id) continue;
      if (cell.status === "weekly_off" && weekdayOf(cell.date) === emp.preferredWeeklyOff) prefHits += 1;
    }
    if (offs > 0 && prefHits === 0 && assigned.length > 0) {
      issues.push({
        id: uid("iss"),
        severity: "info",
        category: "preference",
        employeeId: emp.id,
        title: `${nameOf(emp.id)} weekly off moved off preferred ${weekdayName(emp.preferredWeeklyOff)}`,
        detail: "A different weekday was chosen so brand coverage stayed intact.",
      });
    }
  }

  for (const emp of state.employees.filter((e) => e.active)) {
    const byDate = new Map<string, Assignment[]>();
    for (const a of state.assignments.filter((x) => x.employeeId === emp.id)) {
      for (const date of days) {
        const bp = state.brandProcesses.find(
          (x) => x.brandId === a.brandId && x.processId === a.processId,
        );
        if (!bp || !processOperates(bp.calendar, date, holidays)) continue;
        const cell = roster.cells.find((c) => c.employeeId === emp.id && c.date === date);
        if (cell?.status !== "work") continue;
        const list = byDate.get(date) ?? [];
        list.push(a);
        byDate.set(date, list);
      }
    }
    for (const [date, list] of byDate) {
      const brands = new Set(list.map((a) => a.brandId));
      if (brands.size >= 3) {
        issues.push({
          id: uid("iss"),
          severity: "warning",
          category: "constraint",
          date,
          employeeId: emp.id,
          title: `${nameOf(emp.id)} split across ${brands.size} brands`,
          detail: `On ${date} this person is the working resource for ${[...brands].map(brandOf).join(", ")}. That is allowed but fragile if any extra leave appears.`,
        });
      }
    }
  }

  for (const cover of roster.backups) {
    const cell = roster.cells.find((c) => c.employeeId === cover.employeeId && c.date === cover.date);
    if (cell && !isFreeForCover(cell.status) && cell.status !== "work") {
      issues.push({
        id: uid("iss"),
        severity: "error",
        category: "change",
        date: cover.date,
        employeeId: cover.employeeId,
        brandId: cover.brandId,
        processId: cover.processId,
        title: `Backup ${nameOf(cover.employeeId)} is no longer working`,
        detail: `Cover for ${brandOf(cover.brandId)} ${procOf(cover.processId)} on ${cover.date} is invalid because the backup is ${cell.status}.`,
        suggestion: "Pick a different backup or restore this person to work.",
        backupCandidates: suggestBackups(state, roster, cover.date, cover.brandId, cover.processId),
      });
    }
  }

  return issues;
}

export function applyApprovedLeaves(state: AppState, roster: Roster): Roster {
  if (roster.status === "empty") return roster;
  const leaves = approvedLeaveMap(state);
  const cells = roster.cells.map((c) => {
    const leave = leaves.get(cellKey(c.employeeId, c.date));
    if (!leave) return c;
    return {
      ...c,
      status: leave,
      note: leave === "comp_off" ? "Approved comp-off" : "Approved leave",
    };
  });
  return { ...roster, cells };
}

export function applyBackup(roster: Roster, cover: Omit<BackupCover, "id" | "auto">): Roster {
  const next: Roster = {
    ...roster,
    cells: roster.cells.map((c) =>
      c.employeeId === cover.employeeId && c.date === cover.date
        ? { ...c, status: "work", note: cover.reason, manual: true }
        : c,
    ),
    backups: [
      ...roster.backups.filter(
        (b) =>
          !(
            b.date === cover.date &&
            b.brandId === cover.brandId &&
            b.processId === cover.processId &&
            b.employeeId === cover.employeeId
          ),
      ),
      { ...cover, id: uid("bk"), auto: false },
    ],
    status: roster.status === "published" ? "published" : "draft",
  };
  return next;
}

export function setCellStatus(
  roster: Roster,
  employeeId: string,
  date: string,
  status: CellStatus,
): Roster {
  return {
    ...roster,
    status: roster.status === "empty" ? "draft" : roster.status,
    cells: roster.cells.map((c) =>
      c.employeeId === employeeId && c.date === date
        ? { ...c, status, manual: true, note: c.note || "Manual edit" }
        : c,
    ),
  };
}

export function rosterToCsv(
  state: AppState,
  roster: Roster,
): string {
  const days = daysInMonth(roster.month);
  const header = ["Employee", "Pod", "Role", ...days];
  const lines = [header.join(",")];
  for (const emp of state.employees) {
    const pod = state.pods.find((p) => p.id === emp.podId)?.name ?? "";
    const row = [emp.name, pod, emp.role];
    for (const date of days) {
      const cell = roster.cells.find((c) => c.employeeId === emp.id && c.date === date);
      row.push(cell?.status ?? "");
    }
    lines.push(row.map((v) => `"${v}"`).join(","));
  }
  return lines.join("\n");
}
