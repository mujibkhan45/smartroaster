import { brandName, empName, procCode } from "../labels";
import { useStore } from "../store";

export function ConflictsView({ onOpenRoster }: { onOpenRoster: () => void }) {
  const { state, dispatch } = useStore();
  const issues = [...state.roster.issues].sort((a, b) => {
    const rank = { error: 0, warning: 1, info: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  if (state.roster.status === "empty") {
    return <p className="text-ink/70">Generate a roster to run conflict detection.</p>;
  }

  if (!issues.length) {
    return (
      <div className="rounded-xl border border-sand bg-white p-6">
        <h2 className="font-serif text-2xl">No issues on this draft</h2>
        <p className="text-ink/70 mt-2">Mandatory coverage is met. Preferences that were moved off preferred weekdays are not listed when they were resolved.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/70 max-w-3xl">
        Errors are mandatory constraints (client coverage). Warnings are fragile staffing or missed weekly offs.
        Info is preference movement. Backup recommendations only include people already marked as working that day.
      </p>
      {issues.map((issue) => (
        <article
          key={issue.id}
          className={`rounded-xl border bg-white p-4 ${
            issue.severity === "error"
              ? "border-red-300"
              : issue.severity === "warning"
                ? "border-amber-300"
                : "border-sand"
          }`}
        >
          <div className="flex flex-wrap gap-2 items-center text-xs uppercase tracking-wide">
            <span
              className={`px-2 py-0.5 rounded ${
                issue.severity === "error"
                  ? "bg-red-100 text-red-800"
                  : issue.severity === "warning"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-sky-100 text-sky-900"
              }`}
            >
              {issue.severity} · {issue.category}
            </span>
            {issue.date ? <span>{issue.date}</span> : null}
            {issue.brandId ? <span>{brandName(state, issue.brandId)}</span> : null}
            {issue.processId ? <span>{procCode(state, issue.processId)}</span> : null}
          </div>
          <h3 className="mt-2 font-medium">{issue.title}</h3>
          <p className="text-sm text-ink/70 mt-1">{issue.detail}</p>
          {issue.suggestion ? <p className="text-sm mt-2">{issue.suggestion}</p> : null}
          {issue.backupCandidates?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {issue.backupCandidates.map((c) => (
                <button
                  key={c.employeeId}
                  className="text-sm border border-ink/20 rounded px-2 py-1 hover:bg-sand"
                  disabled={!issue.date || !issue.brandId || !issue.processId}
                  onClick={() => {
                    if (!issue.date || !issue.brandId || !issue.processId) return;
                    dispatch({
                      type: "add-backup",
                      cover: {
                        date: issue.date,
                        employeeId: c.employeeId,
                        brandId: issue.brandId,
                        processId: issue.processId,
                        reason: c.reason,
                      },
                    });
                  }}
                >
                  Assign {empName(state, c.employeeId)}
                  <span className="block text-[11px] text-ink/50">{c.reason}</span>
                </button>
              ))}
            </div>
          ) : null}
        </article>
      ))}
      <button className="text-sm underline" onClick={onOpenRoster}>
        Open roster grid
      </button>
    </div>
  );
}
