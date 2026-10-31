import { useState } from "react";
import { empName } from "../labels";
import { useStore } from "../store";
import type { LeaveStatus, LeaveType } from "../types";

export function AvailabilityView() {
  const { state, dispatch } = useStore();
  const [hol, setHol] = useState({ date: "2026-10-31", name: "" });
  const [leave, setLeave] = useState({
    employeeId: state.employees[1]?.id ?? "",
    date: "2026-10-21",
    type: "planned" as LeaveType,
    status: "approved" as LeaveStatus,
    note: "",
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="rounded-xl border border-sand bg-white p-4">
        <h2 className="font-serif text-xl">Public holidays</h2>
        <p className="text-sm text-ink/70 mt-1">Brand calendars decide whether a holiday still needs coverage.</p>
        <ul className="mt-3 text-sm divide-y divide-sand">
          {state.holidays
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((h) => (
              <li key={h.id} className="py-2 flex justify-between">
                <span>
                  {h.date} · {h.name}
                </span>
                <button className="text-xs text-red-700" onClick={() => dispatch({ type: "remove-holiday", id: h.id })}>
                  Remove
                </button>
              </li>
            ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input type="date" className="border border-sand rounded px-2 py-1.5 text-sm" value={hol.date} onChange={(e) => setHol({ ...hol, date: e.target.value })} />
          <input className="border border-sand rounded px-2 py-1.5 text-sm" placeholder="Name" value={hol.name} onChange={(e) => setHol({ ...hol, name: e.target.value })} />
          <button
            className="bg-ink text-paper rounded px-3 text-sm"
            onClick={() => {
              if (!hol.date || !hol.name) return;
              dispatch({ type: "upsert-holiday", holiday: { id: `hol-${hol.date}`, date: hol.date, name: hol.name } });
              setHol({ date: hol.date, name: "" });
            }}
          >
            Add
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-sand bg-white p-4">
        <h2 className="font-serif text-xl">Leaves and comp-offs</h2>
        <p className="text-sm text-ink/70 mt-1">Only approved rows bind the scheduler. Pending leave is visible but ignored.</p>
        <ul className="mt-3 text-sm divide-y divide-sand max-h-72 overflow-auto">
          {state.leaves
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((l) => (
              <li key={l.id} className="py-2 flex justify-between gap-2">
                <div>
                  {l.date} · {empName(state, l.employeeId)} · {l.type} · {l.status}
                  {l.note ? <div className="text-xs text-ink/50">{l.note}</div> : null}
                </div>
                <button className="text-xs text-red-700" onClick={() => dispatch({ type: "remove-leave", id: l.id })}>
                  Remove
                </button>
              </li>
            ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select className="border border-sand rounded px-2 py-1.5 text-sm col-span-2" value={leave.employeeId} onChange={(e) => setLeave({ ...leave, employeeId: e.target.value })}>
            {state.employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <input type="date" className="border border-sand rounded px-2 py-1.5 text-sm" value={leave.date} onChange={(e) => setLeave({ ...leave, date: e.target.value })} />
          <select className="border border-sand rounded px-2 py-1.5 text-sm" value={leave.type} onChange={(e) => setLeave({ ...leave, type: e.target.value as LeaveType })}>
            <option value="planned">Planned leave</option>
            <option value="comp_off">Comp-off</option>
            <option value="unplanned">Unplanned</option>
          </select>
          <select className="border border-sand rounded px-2 py-1.5 text-sm" value={leave.status} onChange={(e) => setLeave({ ...leave, status: e.target.value as LeaveStatus })}>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
          <input className="border border-sand rounded px-2 py-1.5 text-sm col-span-2" placeholder="Note" value={leave.note} onChange={(e) => setLeave({ ...leave, note: e.target.value })} />
          <button
            className="bg-ink text-paper rounded px-3 py-1.5 text-sm col-span-2"
            onClick={() =>
              dispatch({
                type: "upsert-leave",
                leave: {
                  id: `lv-${leave.employeeId}-${leave.date}`,
                  ...leave,
                },
              })
            }
          >
            Save leave
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-clay/40 bg-white p-4 lg:col-span-2">
        <h2 className="font-serif text-xl">Demonstrate a mid-cycle change</h2>
        <p className="text-sm text-ink/70 mt-2 max-w-3xl leading-relaxed">
          Kabir Rao is the only dedicated owner of VelvetCart, including 365-day Customer Support.
          This action marks him on unplanned leave for 21 Oct 2026 (a Wednesday). The existing roster
          is revalidated, not rebuilt, so you can see the coverage gap and backup recommendations.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="bg-clay text-white rounded px-4 py-2 text-sm" onClick={() => dispatch({ type: "simulate-critical-leave" })}>
            Simulate Kabir leave on 21 Oct
          </button>
          <button className="border border-sand rounded px-4 py-2 text-sm" onClick={() => dispatch({ type: "reset" })}>
            Reset sample data
          </button>
        </div>
        <p className="text-xs text-ink/50 mt-3">
          After simulating, open Conflicts and assign a recommended backup, or generate again so weekly offs can be repaired around the new leave.
        </p>
      </section>
    </div>
  );
}
