export function GuideView() {
  return (
    <div className="max-w-3xl space-y-6 text-sm leading-relaxed">
      <section className="rounded-xl border border-sand bg-white p-5">
        <h2 className="font-serif text-2xl">What this solves</h2>
        <p className="mt-2 text-ink/80">
          Rosterflow is a constraint planner, not a shared calendar. It models employees, pods, brands,
          processes, operating calendars, and minimum staffing as data. Monthly generation assigns weekly
          offs only when coverage can still be met — using floaters as automatic backup if needed — and
          otherwise leaves the conflict visible.
        </p>
      </section>
      <section className="rounded-xl border border-sand bg-white p-5 space-y-2">
        <h2 className="font-serif text-xl">Scheduling rules</h2>
        <ol className="list-decimal pl-5 space-y-1 text-ink/80">
          <li>Approved leave and comp-offs are hard. Pending leave is ignored.</li>
          <li>A process operates only on days allowed by its calendar (365 / no holidays / no Sundays+holidays).</li>
          <li>An employee works if any assigned process is operating, unless they are off.</li>
          <li>If every assigned process is closed (Sunday or holiday), the day is Not required or Public holiday — not a weekly off.</li>
          <li>Weekly off is a preference. Client minimum staffing is mandatory.</li>
          <li>When a weekly off would uncover a brand-process, the generator tries a same-day backup from people already working (floaters and same-process skill first).</li>
          <li>If no legal weekly off exists that week, the person stays on duty and a warning is raised.</li>
          <li>Manual cell edits revalidate immediately. Regeneration can keep those edits.</li>
        </ol>
      </section>
      <section className="rounded-xl border border-sand bg-white p-5 space-y-2">
        <h2 className="font-serif text-xl">Sample dataset (October 2026)</h2>
        <ul className="list-disc pl-5 text-ink/80 space-y-1">
          <li>32 employees in 4 pods (North, West, South, East), each with a pod lead.</li>
          <li>15 brands: 12 with one dedicated owner (~80%), 3 with 2–3 people.</li>
          <li>UrbanSip splits CS / ACC / NDR across three people.</li>
          <li>BrightBite overlaps CS across two people and still needs 2 CS on weekdays; Karan is extra CS on BrightBite and UrbanSip.</li>
          <li>CloudCarry needs 2 CS on weekdays (Leela + Harsh) and has dedicated NDR.</li>
          <li>Petora and MiraSkin have overlapping NDR from a second employee.</li>
          <li>Pod leads and named floaters have no dedicated brand so they can cover weekly offs.</li>
        </ul>
      </section>
      <section className="rounded-xl border border-sand bg-white p-5 space-y-2">
        <h2 className="font-serif text-xl">Assumptions</h2>
        <ul className="list-disc pl-5 text-ink/80 space-y-1">
          <li>One shift per day. Overnight or split shifts are out of scope.</li>
          <li>One weekly off per ISO week when coverage allows.</li>
          <li>Public holidays follow a simplified 2026 India-style calendar and are configurable.</li>
          <li>Backup cover is a day-level overlay; it does not create a standing assignment.</li>
          <li>Data lives in the browser (localStorage). Reset sample data from Availability.</li>
          <li>New brands, processes, people, rules, and assignments can be added in the UI without code changes.</li>
        </ul>
      </section>
    </div>
  );
}
