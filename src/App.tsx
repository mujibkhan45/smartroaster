import { useState } from "react";
import { daysInMonth, monthLabel, shiftMonth } from "./engine/calendar";
import { rosterToCsv } from "./engine/scheduler";
import { useStore } from "./store";
import { AvailabilityView } from "./views/AvailabilityView";
import { BrandsView } from "./views/BrandsView";
import { ConflictsView } from "./views/ConflictsView";
import { CoverageView } from "./views/CoverageView";
import { GuideView } from "./views/GuideView";
import { RosterView } from "./views/RosterView";
import { TeamView } from "./views/TeamView";

const NAV = [
  ["roster", "Roster"],
  ["coverage", "Coverage"],
  ["conflicts", "Conflicts"],
  ["team", "Team"],
  ["brands", "Brands & rules"],
  ["availability", "Availability"],
  ["guide", "How it works"],
] as const;

type View = (typeof NAV)[number][0];

export function App() {
  const { state, dispatch } = useStore();
  const [view, setView] = useState<View>("roster");
  const errors = state.roster.issues.filter((i) => i.severity === "error").length;
  const warnings = state.roster.issues.filter((i) => i.severity === "warning").length;
  const days = daysInMonth(state.roster.month);

  function exportCsv() {
    const csv = rosterToCsv(state, state.roster);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${state.roster.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="flex min-h-screen">
        <aside className="w-56 shrink-0 bg-ink text-paper px-4 py-6 flex flex-col gap-6">
          <div>
            <div className="font-serif text-2xl tracking-tight">Rosterflow</div>
            <div className="text-xs text-sand/80 mt-1">Ops roster planner</div>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`text-left rounded-md px-3 py-2 text-sm ${
                  view === id ? "bg-clay text-white" : "hover:bg-ink-2"
                }`}
              >
                {label}
                {id === "conflicts" && errors > 0 ? (
                  <span className="ml-2 rounded-full bg-white/20 px-1.5 text-[11px]">{errors}</span>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="mt-auto text-[11px] text-sand/70 leading-relaxed">
            {state.employees.length} people · {state.brands.length} brands · {days.length} days
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 border-b border-sand bg-paper/95 backdrop-blur px-6 py-3 flex flex-wrap items-center gap-3">
            <button className="px-2 py-1 border border-sand rounded" onClick={() => dispatch({ type: "set-month", month: shiftMonth(state.roster.month, -1) })}>
              ‹
            </button>
            <div className="font-serif text-xl min-w-44">{monthLabel(state.roster.month)}</div>
            <button className="px-2 py-1 border border-sand rounded" onClick={() => dispatch({ type: "set-month", month: shiftMonth(state.roster.month, 1) })}>
              ›
            </button>
            <span className="text-xs uppercase tracking-wide text-ink/60 border border-sand rounded px-2 py-1">
              {state.roster.status}
            </span>
            {errors > 0 ? (
              <span className="text-xs bg-red-100 text-red-800 rounded px-2 py-1">{errors} coverage errors</span>
            ) : state.roster.status !== "empty" ? (
              <span className="text-xs bg-emerald-100 text-emerald-800 rounded px-2 py-1">Coverage OK</span>
            ) : null}
            {warnings > 0 ? (
              <span className="text-xs bg-amber-100 text-amber-900 rounded px-2 py-1">{warnings} warnings</span>
            ) : null}
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                className="bg-ink text-paper rounded px-3 py-1.5 text-sm"
                onClick={() => dispatch({ type: "generate", preserveManual: false })}
              >
                Generate roster
              </button>
              <button
                className="border border-ink/20 rounded px-3 py-1.5 text-sm"
                onClick={() => dispatch({ type: "generate", preserveManual: true })}
              >
                Regen, keep edits
              </button>
              <button className="border border-ink/20 rounded px-3 py-1.5 text-sm" onClick={() => dispatch({ type: "validate" })}>
                Revalidate
              </button>
              <button
                className="border border-ink/20 rounded px-3 py-1.5 text-sm disabled:opacity-40"
                disabled={state.roster.status === "empty"}
                onClick={() => dispatch({ type: "publish" })}
              >
                Publish
              </button>
              <button className="border border-ink/20 rounded px-3 py-1.5 text-sm" onClick={exportCsv}>
                CSV
              </button>
            </div>
          </header>

          <div className="p-6">
            {view === "roster" ? <RosterView /> : null}
            {view === "coverage" ? <CoverageView /> : null}
            {view === "conflicts" ? <ConflictsView onOpenRoster={() => setView("roster")} /> : null}
            {view === "team" ? <TeamView /> : null}
            {view === "brands" ? <BrandsView /> : null}
            {view === "availability" ? <AvailabilityView /> : null}
            {view === "guide" ? <GuideView /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
