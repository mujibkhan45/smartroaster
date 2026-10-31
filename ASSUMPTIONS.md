# Assumptions

These fill gaps the brief left open so the planner can run. All of them are configurable in the UI except the single-shift model.

## Organisation

- 32 employees, 4 pods, 15 brands, 4 processes (CS, ACC, Retention, NDR).
- About 80% of brands (12/15) have one dedicated employee for every process on that brand.
- UrbanSip: three people, separate processes.
- BrightBite: overlapping CS plus ACC/Retention; weekday CS minimum is 2.
- CloudCarry: two CS (weekday minimum 2) and dedicated NDR.
- Some people work two brands (Karan on BrightBite + UrbanSip CS; Amitabh on Petora + PeakForm NDR; Diya on MiraSkin + CloudCarry NDR).
- Pod leads and floaters are a backup bench: no dedicated brand unless you assign one.

## Calendars

- Three calendars: 365-day; every day except public holidays; Sundays and public holidays off.
- Brand operating calendar and employee weekly-off calendar are separate. An employee works a holiday if any of their assigned processes is 365-day.
- Public holidays are a simplified 2026 India-style list (Republic Day, Holi, Independence Day, Gandhi Jayanti, Dussehra, Diwali, Christmas).

## Time and labour

- One shift per person per day. No night/overlap shift clash beyond “working vs not working”.
- Target: one weekly off per ISO week (Monday start). Not a legal entitlement in the engine — a preference scored below client coverage.
- Approved leave and comp-offs occupy the day; pending leave does not.
- Backup cover is a dated overlay on top of standing assignments.

## Default planning month

October 2026, which includes Gandhi Jayanti (2 Oct) and Dussehra (20 Oct), so 365-day CS still needs holiday coverage.

## Persistence

State is stored in `localStorage` under `rosterflow-state-v1`. Reset from Availability if a demo needs a clean seed.
