import { useState } from "react";
import { CALENDAR_LABEL, empName } from "../labels";
import { uid, useStore } from "../store";
import type { OperatingCalendar } from "../types";

export function BrandsView() {
  const { state, dispatch } = useStore();
  const [brandName, setBrandName] = useState("");
  const [procName, setProcName] = useState("");
  const [procCode, setProcCode] = useState("");
  const [rule, setRule] = useState({
    brandId: state.brands[0]?.id ?? "",
    processId: state.processes[0]?.id ?? "",
    calendar: "no_public_holidays" as OperatingCalendar,
    minStaffWeekday: 1,
    minStaffSunday: 1,
    minStaffHoliday: 0,
  });
  const [asg, setAsg] = useState({
    employeeId: state.employees[0]?.id ?? "",
    brandId: state.brands[0]?.id ?? "",
    processId: state.processes[0]?.id ?? "",
  });

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-sand bg-white p-4">
          <h2 className="font-serif text-xl mb-3">Brands</h2>
          <ul className="text-sm divide-y divide-sand">
            {state.brands.map((b) => {
              const people = new Set(state.assignments.filter((a) => a.brandId === b.id).map((a) => a.employeeId));
              return (
                <li key={b.id} className="py-2 flex justify-between gap-2">
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-ink/60">{people.size} people · {b.notes}</div>
                  </div>
                  <button className="text-xs text-red-700" onClick={() => dispatch({ type: "remove-brand", id: b.id })}>Remove</button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="flex-1 border border-sand rounded px-2 py-1.5 text-sm" placeholder="New brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            <button
              className="bg-ink text-paper rounded px-3 text-sm"
              onClick={() => {
                if (!brandName.trim()) return;
                dispatch({ type: "upsert-brand", brand: { id: uid("brand"), name: brandName, notes: "Added in app" } });
                setBrandName("");
              }}
            >
              Add
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-sand bg-white p-4">
          <h2 className="font-serif text-xl mb-3">Processes</h2>
          <ul className="text-sm space-y-1">
            {state.processes.map((p) => (
              <li key={p.id}><b>{p.code}</b> · {p.name}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="w-20 border border-sand rounded px-2 py-1.5 text-sm" placeholder="Code" value={procCode} onChange={(e) => setProcCode(e.target.value)} />
            <input className="flex-1 border border-sand rounded px-2 py-1.5 text-sm" placeholder="Name" value={procName} onChange={(e) => setProcName(e.target.value)} />
            <button
              className="bg-ink text-paper rounded px-3 text-sm"
              onClick={() => {
                if (!procName.trim() || !procCode.trim()) return;
                dispatch({ type: "upsert-process", process: { id: uid("proc"), name: procName, code: procCode.toUpperCase() } });
                setProcName("");
                setProcCode("");
              }}
            >
              Add
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-sand bg-white p-4">
        <h2 className="font-serif text-xl mb-3">Brand–process working rules</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left bg-sand/50">
              <tr>
                <th className="px-2 py-2">Brand</th>
                <th className="px-2 py-2">Process</th>
                <th className="px-2 py-2">Calendar</th>
                <th className="px-2 py-2">Min weekday / Sun / holiday</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.brandProcesses.map((r) => (
                <tr key={r.id} className="border-t border-sand">
                  <td className="px-2 py-1">{state.brands.find((b) => b.id === r.brandId)?.name}</td>
                  <td className="px-2 py-1">{state.processes.find((p) => p.id === r.processId)?.code}</td>
                  <td className="px-2 py-1 text-xs">{CALENDAR_LABEL[r.calendar]}</td>
                  <td className="px-2 py-1">{r.minStaffWeekday} / {r.minStaffSunday} / {r.minStaffHoliday}</td>
                  <td className="px-2 py-1">
                    <button className="text-xs text-red-700" onClick={() => dispatch({ type: "remove-brand-process", id: r.id })}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-end">
          <select className="border border-sand rounded px-2 py-1.5 text-sm" value={rule.brandId} onChange={(e) => setRule({ ...rule, brandId: e.target.value })}>
            {state.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="border border-sand rounded px-2 py-1.5 text-sm" value={rule.processId} onChange={(e) => setRule({ ...rule, processId: e.target.value })}>
            {state.processes.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
          <select className="border border-sand rounded px-2 py-1.5 text-sm" value={rule.calendar} onChange={(e) => setRule({ ...rule, calendar: e.target.value as OperatingCalendar })}>
            {(Object.keys(CALENDAR_LABEL) as OperatingCalendar[]).map((k) => (
              <option key={k} value={k}>{CALENDAR_LABEL[k]}</option>
            ))}
          </select>
          <input type="number" min={0} className="w-16 border border-sand rounded px-2 py-1.5 text-sm" value={rule.minStaffWeekday} onChange={(e) => setRule({ ...rule, minStaffWeekday: Number(e.target.value) })} />
          <input type="number" min={0} className="w-16 border border-sand rounded px-2 py-1.5 text-sm" value={rule.minStaffSunday} onChange={(e) => setRule({ ...rule, minStaffSunday: Number(e.target.value) })} />
          <input type="number" min={0} className="w-16 border border-sand rounded px-2 py-1.5 text-sm" value={rule.minStaffHoliday} onChange={(e) => setRule({ ...rule, minStaffHoliday: Number(e.target.value) })} />
          <button
            className="bg-ink text-paper rounded px-3 py-1.5 text-sm"
            onClick={() => dispatch({ type: "upsert-brand-process", row: { ...rule, id: uid("bp") } })}
          >
            Add rule
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-sand bg-white p-4">
        <h2 className="font-serif text-xl mb-3">Resource assignments</h2>
        <div className="overflow-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="text-left bg-sand/50">
              <tr>
                <th className="px-2 py-2">Employee</th>
                <th className="px-2 py-2">Brand</th>
                <th className="px-2 py-2">Process</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.assignments.map((a) => (
                <tr key={a.id} className="border-t border-sand">
                  <td className="px-2 py-1">{empName(state, a.employeeId)}</td>
                  <td className="px-2 py-1">{state.brands.find((b) => b.id === a.brandId)?.name}</td>
                  <td className="px-2 py-1">{state.processes.find((p) => p.id === a.processId)?.code}</td>
                  <td className="px-2 py-1">
                    <button className="text-xs text-red-700" onClick={() => dispatch({ type: "remove-assignment", id: a.id })}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <select className="border border-sand rounded px-2 py-1.5 text-sm" value={asg.employeeId} onChange={(e) => setAsg({ ...asg, employeeId: e.target.value })}>
            {state.employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className="border border-sand rounded px-2 py-1.5 text-sm" value={asg.brandId} onChange={(e) => setAsg({ ...asg, brandId: e.target.value })}>
            {state.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="border border-sand rounded px-2 py-1.5 text-sm" value={asg.processId} onChange={(e) => setAsg({ ...asg, processId: e.target.value })}>
            {state.processes.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
          <button
            className="bg-ink text-paper rounded px-3 py-1.5 text-sm"
            onClick={() => dispatch({ type: "upsert-assignment", assignment: { ...asg, id: uid("as") } })}
          >
            Add assignment
          </button>
        </div>
      </section>
    </div>
  );
}
