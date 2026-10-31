import { daysInMonth, processOperates, weekdayShort } from "../engine/calendar";
import { coverageCount, minStaffFor } from "../engine/scheduler";
import { brandName, procCode } from "../labels";
import { useStore } from "../store";

export function CoverageView() {
  const { state } = useStore();
  const days = daysInMonth(state.roster.month);
  const holidays = new Set(state.holidays.map((h) => h.date));

  if (state.roster.status === "empty") {
    return <p className="text-ink/70">Generate a roster to see daily coverage against each brand-process rule.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/70 max-w-3xl">
        Each cell is staffed / required. Green meets the minimum. Red is a mandatory coverage gap.
        Grey means the process is not operating that day.
      </p>
      <div className="overflow-auto rounded-xl border border-sand bg-white max-h-[75vh]">
        <table className="text-[11px] border-collapse min-w-max">
          <thead className="sticky top-0 bg-ink text-paper z-10">
            <tr>
              <th className="sticky left-0 bg-ink px-2 py-2 text-left min-w-40">Brand / process</th>
              {days.map((date) => (
                <th key={date} className="px-1 py-2">
                  {date.slice(-2)}
                  <div className="opacity-70 font-normal">{weekdayShort(date)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.brandProcesses.map((bp) => (
              <tr key={bp.id} className="border-t border-sand">
                <td className="sticky left-0 bg-white px-2 py-1 min-w-40">
                  <div className="font-medium">{brandName(state, bp.brandId)}</div>
                  <div className="text-ink/50">{procCode(state, bp.processId)}</div>
                </td>
                {days.map((date) => {
                  if (!processOperates(bp.calendar, date, holidays)) {
                    return (
                      <td key={date} className="px-1 py-1 text-center text-ink/30">
                        —
                      </td>
                    );
                  }
                  const need = minStaffFor(bp, date, holidays);
                  const { count } = coverageCount(state, state.roster, date, bp.brandId, bp.processId);
                  const ok = count >= need;
                  return (
                    <td
                      key={date}
                      className={`px-1 py-1 text-center font-medium ${
                        ok ? "bg-emerald-50 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {count}/{need}
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
