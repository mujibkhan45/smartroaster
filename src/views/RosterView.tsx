import { useMemo, useState } from "react";
import { daysInMonth, weekdayOf, weekdayShort } from "../engine/calendar";
import { empName, employeeBrands, podName, STATUS_SHORT } from "../labels";
import { useStore } from "../store";
import type { CellStatus } from "../types";

const CYCLE: CellStatus[] = [
  "work",
  "weekly_off",
  "leave",
  "comp_off",
  "public_holiday",
  "not_required",
];

type Mode = "company" | "pod" | "brand" | "process" | "employee";

export function RosterView() {
  const { state, dispatch } = useStore();
  const [mode, setMode] = useState<Mode>("company");
  const [filter, setFilter] = useState("");
  const days = daysInMonth(state.roster.month);
  const holidaySet = useMemo(() => new Set(state.holidays.map((h) => h.date)), [state.holidays]);

  const employees = useMemo(() => {
    let list = state.employees.filter((e) => e.active);
    if (mode === "pod" && filter) list = list.filter((e) => e.podId === filter);
    if (mode === "employee" && filter) list = list.filter((e) => e.id === filter);
    if (mode === "brand" && filter) {
      const ids = new Set(
        state.assignments.filter((a) => a.brandId === filter).map((a) => a.employeeId),
      );
      const backupIds = new Set(
        state.roster.backups.filter((b) => b.brandId === filter).map((b) => b.employeeId),
      );
      list = list.filter((e) => ids.has(e.id) || backupIds.has(e.id));
    }
    if (mode === "process" && filter) {
      const ids = new Set(
        state.assignments.filter((a) => a.processId === filter).map((a) => a.employeeId),
      );
      list = list.filter((e) => ids.has(e.id));
    }
    return [...list].sort((a, b) => a.podId.localeCompare(b.podId) || a.name.localeCompare(b.name));
  }, [state, mode, filter]);

  if (state.roster.status === "empty") {
    return (
      <div className="rounded-xl border border-sand bg-white p-8 max-w-2xl">
        <h2 className="font-serif text-2xl">No roster for this month yet</h2>
        <p className="mt-2 text-ink/70 leading-relaxed">
          Generate a roster to assign weekly offs around client calendars, approved leaves, and
          minimum staffing. Coverage gaps are flagged instead of being hidden.
        </p>
        <button
          className="mt-4 bg-ink text-paper rounded px-4 py-2"
          onClick={() => dispatch({ type: "generate", preserveManual: false })}
        >
          Generate {state.roster.month}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <div className="text-xs uppercase tracking-wide text-ink/50 mb-1">View</div>
          <select
            className="border border-sand rounded px-2 py-1.5 bg-white"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as Mode);
              setFilter("");
            }}
          >
            <option value="company">Company-wide</option>
            <option value="pod">Pod</option>
            <option value="brand">Brand</option>
            <option value="process">Process</option>
            <option value="employee">Employee</option>
          </select>
        </label>
        {mode !== "company" ? (
          <label className="text-sm">
            <div className="text-xs uppercase tracking-wide text-ink/50 mb-1">Filter</div>
            <select
              className="border border-sand rounded px-2 py-1.5 bg-white min-w-48"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All</option>
              {mode === "pod"
                ? state.pods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · lead {empName(state, p.leadEmployeeId)}
                    </option>
                  ))
                : null}
              {mode === "brand"
                ? state.brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))
                : null}
              {mode === "process"
                ? state.processes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </option>
                  ))
                : null}
              {mode === "employee"
                ? state.employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))
                : null}
            </select>
          </label>
        ) : null}
        <div className="text-xs text-ink/60 pb-2">
          Click a cell to cycle status. Manual edits are kept if you regenerate with “keep edits”.
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {(["work", "weekly_off", "leave", "comp_off", "public_holiday", "not_required"] as CellStatus[]).map(
          (s) => (
            <span key={s} className={`px-2 py-0.5 rounded cell-${s}`}>
              {STATUS_SHORT[s]} {s.replace("_", " ")}
            </span>
          ),
        )}
      </div>

      {mode === "employee" && filter ? (
        <EmployeeSummary employeeId={filter} />
      ) : null}
      {mode === "brand" && filter ? <BrandSummary brandId={filter} /> : null}

      <div className="overflow-auto rounded-xl border border-sand bg-white max-h-[70vh]">
        <table className="text-[11px] border-collapse min-w-max">
          <thead className="sticky top-0 bg-ink text-paper z-10">
            <tr>
              <th className="sticky left-0 bg-ink px-2 py-2 text-left min-w-40">Employee</th>
              <th className="px-2 py-2 text-left min-w-28">Pod / work</th>
              {days.map((date) => (
                <th
                  key={date}
                  className={`px-1 py-2 font-medium ${holidaySet.has(date) ? "text-amber-200" : ""} ${
                    weekdayOf(date) === 0 ? "text-sky-200" : ""
                  }`}
                >
                  <div>{date.slice(-2)}</div>
                  <div className="font-normal opacity-70">{weekdayShort(date)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t border-sand">
                <td className="sticky left-0 bg-white px-2 py-1 font-medium min-w-40">
                  {emp.name}
                  <div className="text-[10px] text-ink/50 font-normal">{emp.role.replace("_", " ")}</div>
                </td>
                <td className="px-2 py-1 text-ink/70 min-w-28">
                  {podName(state, emp.podId)}
                  <div className="text-[10px]">{employeeBrands(state, emp.id)}</div>
                </td>
                {days.map((date) => {
                  const cell = state.roster.cells.find(
                    (c) => c.employeeId === emp.id && c.date === date,
                  );
                  const status = cell?.status ?? "not_required";
                  const isBackup = state.roster.backups.some(
                    (b) => b.employeeId === emp.id && b.date === date,
                  );
                  return (
                    <td key={date} className="p-0">
                      <button
                        title={`${date} · ${status}${cell?.manual ? " (manual)" : ""}${isBackup ? " · backup cover" : ""}`}
                        className={`w-9 h-8 block cell-${status} ${cell?.manual ? "ring-1 ring-ink/40" : ""} ${
                          isBackup ? "outline outline-1 outline-clay" : ""
                        }`}
                        onClick={() => {
                          const idx = CYCLE.indexOf(status);
                          const next = CYCLE[(idx + 1) % CYCLE.length];
                          dispatch({ type: "set-cell", employeeId: emp.id, date, status: next });
                        }}
                      >
                        {STATUS_SHORT[status]}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeeSummary({ employeeId }: { employeeId: string }) {
  const { state } = useStore();
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return null;
  const cells = state.roster.cells.filter((c) => c.employeeId === employeeId);
  const counts = CYCLE.map((s) => [s, cells.filter((c) => c.status === s).length] as const);
  const covers = state.roster.backups.filter((b) => b.employeeId === employeeId);
  return (
    <div className="rounded-lg border border-sand bg-white p-4 text-sm">
      <div className="font-medium">{emp.name}</div>
      <div className="text-ink/70 mt-1">{employeeBrands(state, emp.id)}</div>
      <div className="flex flex-wrap gap-3 mt-2 text-xs">
        {counts.map(([s, n]) => (
          <span key={s}>
            {s.replace("_", " ")}: <b>{n}</b>
          </span>
        ))}
        <span>backup covers given: <b>{covers.length}</b></span>
      </div>
    </div>
  );
}

function BrandSummary({ brandId }: { brandId: string }) {
  const { state } = useStore();
  const brand = state.brands.find((b) => b.id === brandId);
  const rules = state.brandProcesses.filter((r) => r.brandId === brandId);
  const people = state.assignments.filter((a) => a.brandId === brandId);
  return (
    <div className="rounded-lg border border-sand bg-white p-4 text-sm">
      <div className="font-medium">{brand?.name}</div>
      <p className="text-ink/70 mt-1">{brand?.notes}</p>
      <div className="mt-2 text-xs space-y-1">
        {rules.map((r) => (
          <div key={r.id}>
            {state.processes.find((p) => p.id === r.processId)?.code}: {r.calendar} · min {r.minStaffWeekday}/{r.minStaffSunday}/{r.minStaffHoliday} (weekday/Sun/holiday)
            {" · "}
            {people
              .filter((a) => a.processId === r.processId)
              .map((a) => empName(state, a.employeeId))
              .join(", ") || "unassigned"}
          </div>
        ))}
      </div>
    </div>
  );
}
