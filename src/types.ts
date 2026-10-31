export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type OperatingCalendar =
  | "full_365"
  | "no_public_holidays"
  | "no_sundays_or_holidays";

export type EmployeeRole = "ops_manager" | "pod_lead" | "associate" | "floater";

export type CellStatus =
  | "work"
  | "weekly_off"
  | "leave"
  | "comp_off"
  | "public_holiday"
  | "not_required";

export type IssueSeverity = "error" | "warning" | "info";

export type RosterStatus = "empty" | "draft" | "published";

export interface Pod {
  id: string;
  name: string;
  leadEmployeeId: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  podId: string;
  role: EmployeeRole;
  preferredWeeklyOff: Weekday;
  active: boolean;
}

export interface Brand {
  id: string;
  name: string;
  notes: string;
}

export interface ProcessDef {
  id: string;
  name: string;
  code: string;
}

export interface BrandProcess {
  id: string;
  brandId: string;
  processId: string;
  calendar: OperatingCalendar;
  minStaffWeekday: number;
  minStaffSunday: number;
  minStaffHoliday: number;
}

export interface Assignment {
  id: string;
  employeeId: string;
  brandId: string;
  processId: string;
}

export interface PublicHoliday {
  id: string;
  date: string;
  name: string;
}

export type LeaveType = "planned" | "comp_off" | "unplanned";
export type LeaveStatus = "approved" | "pending";

export interface Leave {
  id: string;
  employeeId: string;
  date: string;
  type: LeaveType;
  status: LeaveStatus;
  note: string;
}

export interface RosterCell {
  employeeId: string;
  date: string;
  status: CellStatus;
  manual: boolean;
  note: string;
}

export interface BackupCover {
  id: string;
  date: string;
  employeeId: string;
  brandId: string;
  processId: string;
  reason: string;
  auto: boolean;
}

export interface BackupCandidate {
  employeeId: string;
  reason: string;
}

export interface Issue {
  id: string;
  severity: IssueSeverity;
  category: "coverage" | "constraint" | "preference" | "change";
  date?: string;
  employeeId?: string;
  brandId?: string;
  processId?: string;
  title: string;
  detail: string;
  suggestion?: string;
  backupCandidates?: BackupCandidate[];
}

export interface Roster {
  month: string;
  status: RosterStatus;
  generatedAt: string;
  cells: RosterCell[];
  backups: BackupCover[];
  issues: Issue[];
}

export interface AppState {
  pods: Pod[];
  employees: Employee[];
  brands: Brand[];
  processes: ProcessDef[];
  brandProcesses: BrandProcess[];
  assignments: Assignment[];
  holidays: PublicHoliday[];
  leaves: Leave[];
  roster: Roster;
}
