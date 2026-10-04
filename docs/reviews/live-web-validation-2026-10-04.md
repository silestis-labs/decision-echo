# Live web workflow validation — 2026-10-04

## Result

A native Google Chrome run completed Capture → Work Map → Teach → controlled sandbox save → reviewed skill download, using real browser tab capture, real OpenAI and real ElevenLabs expert/tutor connections. Notion credentials and writes were not used. This proves the tested synthetic demo path, not general production readiness or human microphone transcription.

## Observed execution

- Chrome captured the selected Decision Echo tab. Before the fix, model observation held the upload lock and frame times were approximately 8–10 seconds apart. After separating observation scheduling, changed frames arrived at 09:28:48, 09:28:50, 09:28:52, 09:28:54 and 09:28:56 local time.
- The real ElevenLabs expert acknowledged the binding Jonas assignment and asked when to escalate if Jonas is unavailable. Synthetic typed replies used a muted microphone. Three capture answers and three distinct debrief answers were explicitly labeled synthetic and linked to actual captured frames.
- Real OpenAI compilation returned four rules with exact source quotes and evidence links, covering the required assignee and whole-week no-overlap reasoning. The map was reviewed and confirmed for the synthetic test.
- Assigning Lea to the presentation produced a required-assignee blocking finding. Holding the ready urgent Atlas task also blocked case completion. Save remained disabled.
- The visual coach saw Lea against Jonas-only in the planner details. It marked the wider schedule uncertain because intervals were outside the captured viewport. When the capture showed only tutor controls, it correctly reported insufficient scheduling context. Do not claim the model can see off-screen fields.
- The real ElevenLabs tutor explained why Lea violates the confirmed client restriction. The plan was corrected to Jonas; Atlas was explicitly escalated with Jonas as follow-up owner and a checkpoint at 2026-10-08 11:00 Europe/Berlin.
- The corrected proposal passed. An explicit sandbox commit returned “Sandbox proposal saved. No Notion workspace was changed.” Tasks became read-only / Saved / Confirmed.
- Chrome completed the reviewed SKILL.md download (2,915 bytes). The downloaded artifact contains synthetic labels, the Jonas rule and evidence references. Sensors and voice were stopped.

A development hot reload initially interrupted the native run. All edits were frozen, the browser recovered safely with sensors off, and the run resumed with fresh sharing permission. Live demonstrations should use a stable build without concurrent hot reloads.

## Fix and regressions

`ObservationQueue` decouples screen uploads from inference, retaining one serial model request and the newest pending frame. Off-record aborts it and fences stale results. Companion epoch handling and visual-discussion guards were also tightened. Saving an answer clears its pinned evidence selection so a subsequent answer does not inherit the previous frame. Typecheck, production build and 42 unit tests passed. The isolated browser regression passed after the queue change, including privacy, recovery, map confirmation, intervention, correction, commit and export.

A separate real-provider voice regression passed expert/tutor connections, grounded Jonas replies, disabled invalid save, corrected save and download with zero browser page errors. Its screen and microphone were synthetic fixtures; distinguish that test from the native capture run.

A separate real OpenAI vision fixture used gpt-6.1-sol: compile 5,802 ms, visual coaching 3,285 ms. These are single samples, not p95 performance guarantees.

## Remaining product limits

- Human microphone speech recognition has not been verified in this run. Complete a human spoken run before claiming that path is ready.
- Executable learned policy supports predefined rule operators; arbitrary expert prose does not automatically become executable policy. Source constraints now check supplied capacity, required assignees, dependencies, effort and deadlines independently. The reference Morning only label means start before noon in Europe/Berlin; see the [template interpretation](../demo/planning-workspace.md).
- The skill catalog is scoped to browser-tab session storage. There is no cross-device account library.
- Question/answer/frame association is pinned while an answer is drafted; subsequent prompts are queued and require explicit adoption. Expert review of the actual quote and frame remains required.
- The rebuilt planner currently uses the Atlas case; the separate Client Report / hotline policy case is not implemented by this work.
- Local demo success does not establish deployed Cloudflare availability, onboarding for new users, or macOS companion permissions.

## Web hardening follow-up — 2026-10-04

Independent implementation and review addressed interview question/answer/frame races, microphone/capture retry messages, API deadlines and malformed session-catalog entries. Draft answers remain associated with their original screen moment while later questions queue. A failed save retains the draft; incoming speech during a save stays in the transcript without relabeling evidence. Source constraints are presented separately from evidence-backed expert rules. Saved planners are read only and use explicit saved-state wording.

The public creation gate now requires a demo access code unless both the configured application origin and actual request origin are loopback. This prevents deployment with an accidentally retained localhost configuration from allowing unauthenticated creation through a public endpoint. Existing sessions remain capability-authenticated. Companion connection export uses the current application origin rather than a fixed local backend.

API requests have a 35-second deadline and no mutation retry. If delivery is uncertain, inspect the recovered session before repeating a change. Recovery storage validation preserves valid entries even when another catalog entry is malformed.

After these changes, the real ElevenLabs expert/tutor regression again passed synthetic typed interaction, invalid-save prevention, correction, explicit sandbox save and skill download. The isolated browser regression passed capture/debrief/map/correction/save/export/reload/off-record and mocked visual coach checks. Real 60-second capture-lease expiry, epoch invalidation and rejection of paused uploads also passed. The final phase-boundary review and checks are recorded below.

## Final frozen-source checks

Sidebar navigation pauses capture and voice, removes queued prompts from the previous phase and retains the active draft with its original frame and phase. Replies in the tutor/library or a different draft phase stay transcript-only. Completing Capture or entering Teach refuses unsaved evidence, then clears old queued questions so they cannot count as new debrief questions. These corrections passed independent source review.

Final `npm run check`: TypeScript, **67 tests across 17 files**, and production build passed. Final isolated `npm run test:api` and `npm run test:browser` passed. `npm run test:lease` passed real lease expiry and stale upload rejection. The real ElevenLabs regression passed before the final navigation-only changes; it was not rerun after those guards. The final browser regression verifies the changed navigation paths with mocked media and providers. One intermediate browser run timed out during UI edits; the repeated run with frozen source passed, including companion heartbeat.

Native Chrome recovery and navigation inspection showed the saved plan, Jonas assignment, Atlas escalation, source capacities, disabled edit/save/reset controls and explicit “Saved · Confirmed” wording. Sensors remained off. This proves the current local controlled demo flow; account synchronization, deployment and human microphone ASR remain separate gates.
