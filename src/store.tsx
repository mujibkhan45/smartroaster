import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { createSeedState, emptyRoster } from "./data/seed";
import {
  applyApprovedLeaves,
  applyBackup,
  generateRoster,
  setCellStatus,
  uid,
  validateRoster,
} from "./engine/scheduler";
import type {
  AppState,
  Assignment,
  BackupCover,
  Brand,
  BrandProcess,
  CellStatus,
  Employee,
  Leave,
  Pod,
  ProcessDef,
  PublicHoliday,
} from "./types";

const STORAGE_KEY = "rosterflow-state-v1";

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "reset" }
  | { type: "set-month"; month: string }
  | { type: "generate"; preserveManual: boolean }
  | { type: "validate" }
  | { type: "publish" }
  | { type: "set-cell"; employeeId: string; date: string; status: CellStatus }
  | { type: "add-backup"; cover: Omit<BackupCover, "id" | "auto"> }
  | { type: "remove-backup"; id: string }
  | { type: "upsert-employee"; employee: Employee }
  | { type: "remove-employee"; id: string }
  | { type: "upsert-brand"; brand: Brand }
  | { type: "remove-brand"; id: string }
  | { type: "upsert-process"; process: ProcessDef }
  | { type: "upsert-pod"; pod: Pod }
  | { type: "upsert-brand-process"; row: BrandProcess }
  | { type: "remove-brand-process"; id: string }
  | { type: "upsert-assignment"; assignment: Assignment }
  | { type: "remove-assignment"; id: string }
  | { type: "upsert-holiday"; holiday: PublicHoliday }
  | { type: "remove-holiday"; id: string }
  | { type: "upsert-leave"; leave: Leave }
  | { type: "remove-leave"; id: string }
  | { type: "simulate-critical-leave" };

function persist(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function revalidate(state: AppState): AppState {
  if (state.roster.status === "empty") return state;
  const roster = applyApprovedLeaves(state, state.roster);
  return { ...state, roster: { ...roster, issues: validateRoster(state, roster) } };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "reset":
      return createSeedState();
    case "set-month":
      return {
        ...state,
        roster:
          state.roster.month === action.month
            ? state.roster
            : emptyRoster(action.month),
      };
    case "generate": {
      const roster = generateRoster(state, state.roster.month, action.preserveManual);
      return { ...state, roster };
    }
    case "validate":
      return revalidate(state);
    case "publish":
      return { ...state, roster: { ...state.roster, status: "published" } };
    case "set-cell": {
      const roster = setCellStatus(state.roster, action.employeeId, action.date, action.status);
      roster.issues = validateRoster(state, roster);
      return { ...state, roster };
    }
    case "add-backup": {
      const roster = applyBackup(state.roster, action.cover);
      roster.issues = validateRoster(state, roster);
      return { ...state, roster };
    }
    case "remove-backup": {
      const roster = {
        ...state.roster,
        backups: state.roster.backups.filter((b) => b.id !== action.id),
      };
      roster.issues = validateRoster(state, roster);
      return { ...state, roster };
    }
    case "upsert-employee": {
      const exists = state.employees.some((e) => e.id === action.employee.id);
      return revalidate({
        ...state,
        employees: exists
          ? state.employees.map((e) => (e.id === action.employee.id ? action.employee : e))
          : [...state.employees, action.employee],
      });
    }
    case "remove-employee":
      return revalidate({
        ...state,
        employees: state.employees.filter((e) => e.id !== action.id),
        assignments: state.assignments.filter((a) => a.employeeId !== action.id),
      });
    case "upsert-brand": {
      const exists = state.brands.some((b) => b.id === action.brand.id);
      return revalidate({
        ...state,
        brands: exists
          ? state.brands.map((b) => (b.id === action.brand.id ? action.brand : b))
          : [...state.brands, action.brand],
      });
    }
    case "remove-brand":
      return revalidate({
        ...state,
        brands: state.brands.filter((b) => b.id !== action.id),
        brandProcesses: state.brandProcesses.filter((b) => b.brandId !== action.id),
        assignments: state.assignments.filter((a) => a.brandId !== action.id),
      });
    case "upsert-process": {
      const exists = state.processes.some((p) => p.id === action.process.id);
      return {
        ...state,
        processes: exists
          ? state.processes.map((p) => (p.id === action.process.id ? action.process : p))
          : [...state.processes, action.process],
      };
    }
    case "upsert-pod": {
      const exists = state.pods.some((p) => p.id === action.pod.id);
      return {
        ...state,
        pods: exists
          ? state.pods.map((p) => (p.id === action.pod.id ? action.pod : p))
          : [...state.pods, action.pod],
      };
    }
    case "upsert-brand-process": {
      const exists = state.brandProcesses.some((r) => r.id === action.row.id);
      return revalidate({
        ...state,
        brandProcesses: exists
          ? state.brandProcesses.map((r) => (r.id === action.row.id ? action.row : r))
          : [...state.brandProcesses, action.row],
      });
    }
    case "remove-brand-process":
      return revalidate({
        ...state,
        brandProcesses: state.brandProcesses.filter((r) => r.id !== action.id),
      });
    case "upsert-assignment": {
      const exists = state.assignments.some((a) => a.id === action.assignment.id);
      return revalidate({
        ...state,
        assignments: exists
          ? state.assignments.map((a) => (a.id === action.assignment.id ? action.assignment : a))
          : [...state.assignments, action.assignment],
      });
    }
    case "remove-assignment":
      return revalidate({
        ...state,
        assignments: state.assignments.filter((a) => a.id !== action.id),
      });
    case "upsert-holiday": {
      const exists = state.holidays.some((h) => h.id === action.holiday.id);
      return revalidate({
        ...state,
        holidays: exists
          ? state.holidays.map((h) => (h.id === action.holiday.id ? action.holiday : h))
          : [...state.holidays, action.holiday],
      });
    }
    case "remove-holiday":
      return revalidate({
        ...state,
        holidays: state.holidays.filter((h) => h.id !== action.id),
      });
    case "upsert-leave": {
      const exists = state.leaves.some((l) => l.id === action.leave.id);
      return revalidate({
        ...state,
        leaves: exists
          ? state.leaves.map((l) => (l.id === action.leave.id ? action.leave : l))
          : [...state.leaves, action.leave],
      });
    }
    case "remove-leave":
      return revalidate({
        ...state,
        leaves: state.leaves.filter((l) => l.id !== action.id),
      });
    case "simulate-critical-leave": {
      const leave: Leave = {
        id: uid("lv"),
        employeeId: "emp-02",
        date: "2026-10-21",
        type: "unplanned",
        status: "approved",
        note: "Demo: dedicated VelvetCart owner unavailable on a required CS day",
      };
      const next = {
        ...state,
        leaves: [...state.leaves.filter((l) => !(l.employeeId === leave.employeeId && l.date === leave.date)), leave],
      };
      return revalidate(next);
    }
    default:
      return state;
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    return JSON.parse(raw) as AppState;
  } catch {
    return createSeedState();
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(
  null,
);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    persist(state);
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("Store missing");
  return ctx;
}

export { uid };
