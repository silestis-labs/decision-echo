# Planning workspace

The Decision Echo Planning Sandbox independently recreates the planning layout inspected in the team's Notion demo workspace: gray workspace navigation, breadcrumb, green page icon, team capacity table, task database, deadline calendar, production/review timeline and task sidepeek. It uses Decision Echo branding and existing synthetic session data; no Notion source code or assets are included.

## Use

Start a sandbox session. In Capture, the three expert tasks are editable local practice drafts. Use Table, Calendar or Timeline; select a task title to open its properties. Focus planner opens the workspace at full viewport size. Exit full view to return to capture or coaching controls. Search and calendar/week navigation change the view only.

After the expert confirms the Work Map, Teach opens the held-out case. Edit assignment, decision, work times, review reservation and follow-up fields. Check with the learned rules, correct any blocking finding, then explicitly approve saving. Every proposal edit invalidates the previous validation. The server validates again before committing. Completed commits make the planner read-only and display Saved / Confirmed. Capture practice edits have no save action.

## Persistence and time

Planner edits stay in React state and disappear on reload until committed. They do not autosave to Notion or update the server's schedule. Validation stores check/progress metadata, not a committed proposal. Calendar and capacity labels use Europe/Berlin; native date inputs use the browser's local time, stated in the workspace. Task constraints are read-only source facts because the server intentionally does not accept them as proposal edits.

## Current scope

The latest Notion runbook uses a Client Report / hidden hotline rule as its main learner case. The current product still uses Atlas and the existing supported rule operators. This UI change preserves that tested domain behavior; it does not preload the private expert role card or claim the hotline scenario is implemented. The capacity table reflects the session's actual data rather than showing values the validator does not use. Real Notion page edits still autosave; only this controlled sandbox write path has the pre-commit gate.

The task table has horizontal scrolling for its many properties. The recreation covers the planning surface, not Notion's general page editor, AI, account settings, collaboration or automations.

## Verification

Typecheck, 39 unit tests and production build pass. The isolated Durable Object API regression covers invalid plan rejection, correction, stale revisions and duplicate commits. Browser regression uses a synthetic screen stream and mocked visual-coach results, with a disposable Worker that has no provider credentials. Manual browser inspection verified table, calendar, timeline, property editing and full-view mode. These checks do not establish new hardware capture or live voice/Notion behavior.

## Manual navigation audit — 2026-10-04

In-app browser click-through verified Team capacity, deadline calendar, month paging, timeline, task sidepeek and search. Fixed full-view sidebar/header scrolling away, removed the decorative workspace dropdown arrow, and made sidebar calendar navigation scroll after the view renders. Source data transfer remains partial: current session capacity omits Jonas's morning windows; the Client Report and its learned hotline policy are absent; source metadata such as Customer, Description, Training Stage, Time Window and Review Status is not represented completely by the existing task contract. No live capture, voice call or plan commit was initiated during this navigation audit.

## Capacity and source metadata transfer — 2026-10-04

The sandbox seed and demo CSVs now contain all ten inspected availability windows, including Jonas on Wednesday 09:00–12:00 and Thursday 08:00–12:00, in Europe/Berlin. The capacity display and validator consume the same session availability.

Customer, Description, Training Stage, Time Window, Planning Week, Dependency and Review Status are represented in the task contract, optional Notion property mapping and task details. Customer, Training Stage and Review Status also appear in the task table. Review Status is a read-only source fact: a reserved review is Planned, and committing a schedule never promotes it to Approved. The API ignores forged proposal changes to these source fields.

Untouched legacy sandbox sessions receive the current template when loaded. Sessions with answers, evidence, active recording, a map, a later phase or a commit retain their original capacity and source values; missing fields receive safe defaults. Start a new sandbox to use the complete template for such sessions. The historical audit above records the earlier gaps; capacity and metadata gaps are now resolved. The Client Report / hotline case remains outside this change.

## Source constraints and learned judgment — 2026-10-04

Explicit required assignees, supplied availability, dependency readiness, effort and deadlines are source constraints, enforced even when no matching expert operator was learned. Findings label these checks `Source constraint` and contain no invented expert quote. When an evidenced operator provides the same check, its expert explanation is retained without a duplicate finding. Overlap and other judgment policies remain evidence-dependent.

The reference template labels a 09:00–13:00 cohort task “Morning only”. To preserve that reference example, this template interprets the label as **start before noon in Europe/Berlin**. It does not impose a whole-slot noon cutoff or claim that this interpretation generalizes to other customers. A stricter morning-only policy needs an explicit template and capacity change.
