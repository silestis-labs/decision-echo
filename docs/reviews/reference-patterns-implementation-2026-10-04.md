# Reference patterns applied to Decision Echo

Implemented and checked 2026-10-04. The changes independently implement useful interaction patterns; no third-party source, fonts or assets were incorporated.

## Implemented behavior

- Capture/Map/Teach progress derives from saved expert answers, the capture guardrail, debrief answers, map confirmation/version and the current proposal check. Changing a proposal invalidates its displayed check. Counters describe observed work, not proficiency.
- Rule review places explanations and saved expert quotes beside explicitly linked screen, answer and activity evidence. Related interview answers are labeled as sharing source moments, rather than automatically establishing every rule. Missing references and unloaded images are disclosed. Evidence can be opened from this view.
- The first rule disclosure opens initially; others can be expanded. Teach and the skill library keep the full review behind a disclosure so the learner plan remains accessible.
- Existing evidence links now use readable kind/time labels. Activity evidence is no longer labeled as an expert answer.
- Narrow-screen interview controls shrink correctly and long capture-source labels wrap rather than widening the page.
- The [demo walkthrough](../demo-walkthrough.md) supplies an explicitly synthetic expert fixture, unseen-case overlap/correction and a 60-versus-180-minute rule comparison across separately confirmed sessions. It is a rehearsal guide, not proof of a completed live interview.

Existing version-bound confirmation, stale-result rejection and controlled save paths remain the authority. Immutable historical map archives and adaptive practice-case selection were not added in this UI/documentation change.

## Actual verification

- `npm run check`: TypeScript, 113 tests in 19 files and production build passed. Final CSS wrapping adjustment was followed by another successful build and browser run.
- `npm run test:api`: isolated local Durable Object API passed capability/provenance, held-out case, confirmed-map gate, blocked overlap, complete correction, stale revision and duplicate commit checks.
- `npm run test:browser`: final run passed with additional progress, rule-evidence opening, stale proposal status and 390px page-width assertions. This uses synthetic canvas screen capture, typed synthetic answers, isolated backend and mocked visual-coach responses; no paid provider calls.
- Desktop/mobile evidence-review screenshots visually inspected. The new mobile check first exposed existing interview overflow; layout/text wrapping fixes resolved it before the final passing run.
- Independent source review found no actionable integrated UI/provenance issue. `git diff --check` passed.

No human microphone, live provider, native capture permission, deployment or real Notion-write verification in this change. The existing bundle-size build warning remains. No commits or pushes performed.
