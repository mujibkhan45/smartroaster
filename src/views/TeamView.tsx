import { useState } from "react";
import { weekdayName } from "../engine/calendar";
import { employeeBrands, podName } from "../labels";
import { uid, useStore } from "../store";
import type { Employee, EmployeeRole, Weekday } from "../types";

export function TeamView() {
  const { state, dispatch } = useStore();
  const blank: Employee = {
    id: "",
    name: "",
    email: "",
    podId: state.pods[0]?.id ?? "",
    role: "associate",
    preferredWeeklyOff: 0,
    active: true,
  };
  const [form, setForm] = useState<Employee>(blank);

  function save() {
    if (!form.name.trim()) return;
    dispatch({
      type: "upsert-employee",
      employee: { ...form, id: form.id || uid("emp"), email: form.email || `${form.name.toLowerCase().replace(/\s+/g, ".")}@ops.local` },
    });
    setForm(blank);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-xl border border-sand bg-white overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-sand/60 text-left">
            <tr>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Pod</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Pref off</th>
              <th className="px-3 py-2">Assignments</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {state.employees.map((e) => (
              <tr key={e.id} className="border-t border-sand">
                <td className="px-3 py-2">
                  <button className="text-left hover:underline" onClick={() => setForm(e)}>
                    {e.name}
                  </button>
                  <div className="text-xs text-ink/50">{e.email}</div>
                </td>
                <td className="px-3 py-2">{podName(state, e.podId)}</td>
                <td className="px-3 py-2">{e.role.replace("_", " ")}</td>
                <td className="px-3 py-2">{weekdayName(e.preferredWeeklyOff).slice(0, 3)}</td>
                <td className="px-3 py-2 text-xs">{employeeBrands(state, e.id)}</td>
                <td className="px-3 py-2">
                  <button className="text-xs text-red-700" onClick={() => dispatch({ type: "remove-employee", id: e.id })}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="rounded-xl border border-sand bg-white p-4 space-y-3 h-fit"
        onSubmit={(ev) => {
          ev.preventDefault();
          save();
        }}
      >
        <h2 className="font-serif text-xl">{form.id ? "Edit employee" : "Add employee"}</h2>
        <input className="w-full border border-sand rounded px-2 py-1.5" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="w-full border border-sand rounded px-2 py-1.5" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <select className="w-full border border-sand rounded px-2 py-1.5" value={form.podId} onChange={(e) => setForm({ ...form, podId: e.target.value })}>
          {state.pods.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select className="w-full border border-sand rounded px-2 py-1.5" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}>
          <option value="associate">Associate</option>
          <option value="floater">Floater / bench</option>
          <option value="pod_lead">Pod lead</option>
          <option value="ops_manager">Ops manager</option>
        </select>
        <select className="w-full border border-sand rounded px-2 py-1.5" value={form.preferredWeeklyOff} onChange={(e) => setForm({ ...form, preferredWeeklyOff: Number(e.target.value) as Weekday })}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <option key={d} value={d}>Preferred weekly off: {weekdayName(d)}</option>
          ))}
        </select>
        <label className="text-sm flex gap-2 items-center">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Active
        </label>
        <div className="flex gap-2">
          <button className="bg-ink text-paper rounded px-3 py-1.5 text-sm" type="submit">Save</button>
          <button className="text-sm" type="button" onClick={() => setForm(blank)}>Clear</button>
        </div>
        <PodEditor />
      </form>
    </div>
  );
}

function PodEditor() {
  const { state, dispatch } = useStore();
  const [name, setName] = useState("");
  const [lead, setLead] = useState(state.employees[0]?.id ?? "");
  return (
    <div className="pt-4 border-t border-sand space-y-2">
      <h3 className="font-medium text-sm">Pods</h3>
      <ul className="text-sm space-y-1">
        {state.pods.map((p) => (
          <li key={p.id}>
            {p.name} · lead {state.employees.find((e) => e.id === p.leadEmployeeId)?.name}
          </li>
        ))}
      </ul>
      <input className="w-full border border-sand rounded px-2 py-1.5 text-sm" placeholder="New pod name" value={name} onChange={(e) => setName(e.target.value)} />
      <select className="w-full border border-sand rounded px-2 py-1.5 text-sm" value={lead} onChange={(e) => setLead(e.target.value)}>
        {state.employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
      <button
        type="button"
        className="text-sm underline"
        onClick={() => {
          if (!name.trim()) return;
          dispatch({ type: "upsert-pod", pod: { id: uid("pod"), name, leadEmployeeId: lead } });
          setName("");
        }}
      >
        Add pod
      </button>
    </div>
  );
}
