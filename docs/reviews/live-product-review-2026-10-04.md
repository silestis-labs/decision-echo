# Live product review — 2026-10-04

## Verdict

The controlled weekly-planning web workflow is ready for a supervised live demo. Real ElevenLabs expert/tutor connections and real OpenAI inference worked in the local environment. The complete synthetic learning workflow, unseen Atlas conflict, correction, approved save and skill export passed. This is not a certification of general production readiness.

The main remaining demo issues are variable vision/map latency and conversational discipline: one observed expert reply asked two questions in one turn. Human microphone recognition and the actual operating-system screen-sharing picker require a final human rehearsal. Account-wide storage, deployed operation and native macOS permissions were not verified here.

## Environment and evidence boundary

- Local Vite UI `127.0.0.1:5173`, local Wrangler API `127.0.0.1:8787`.
- Configured OpenAI model reported by the running server: `gpt-6.1-sol`, through Responses API.
- Actual configured ElevenLabs expert and tutor connections; labeled synthetic typed narration, fake muted microphone. This verifies context/response integration, not ASR or human expertise.
- Playwright test-owned Chromium instances perform actual UI clicks and edits. They do not control the user's existing Chrome profile. Existing Chrome was visually inspected; native calendar-click automation did not establish a successful state change and is not counted as passed.
- Test display-media uses a canvas instead of the OS permission picker. The learning test feeds real rendered planner pixels into that canvas and verifies a changed retained frame. The planner test sends a real rendered planner screenshot directly to `/observe`; its automatic canvas observations are stubbed. These are separate integration paths, not a claim that every sensor/provider was tested simultaneously against a hardware screen share.
- Synthetic sandbox only; no Notion write, deployment, provider configuration change, commit or push.
- Review covers the working tree based on `5592f1c`, including uncommitted full-view UI changes. Independent read-only review checked implementation boundaries and the new tests' assertions.

## Executed checks

| Check | Outcome | Evidence / limits |
| --- | --- | --- |
| TypeScript, unit suite, production build | Passed | 70 tests / 18 files; build emits a large-bundle warning. |
| Actual local Durable Object API | Passed | Capability auth, held-out case isolation, provenance, privacy epoch, confirmation gate, complete-plan conflict checks, stale revision and duplicate commit. |
| Browser regression | Passed | Capture/debrief/map/teach/save/export, recovery, privacy races, full-view controls and responsive layouts. Visual coach portions in this test are mocked. |
| Extension panel | Passed | Consent/origin/bearer checks, delayed-frame rejection, local restart and heartbeat behavior. |
| Actual unpacked MV3 runtime | Passed | Content injection, shortcut privacy, screenshot consent, transfer, pause/navigation stop, memory reuse/forget. Backend is synthetic. |
| Actual capture lease expiry | Passed | Approximately 61-second expiry, epoch invalidation, stale evidence rejection and authenticated deletion. |
| Live ElevenLabs expert + tutor | Passed | Typed synthetic expert reply; tutor explains wrong required assignee; save stays disabled; correction/save/export. Its reviewed map uses explicitly synthetic API fixtures. |
| Live OpenAI vision fixture | Passed | Wrong Lea/Jonas assignment recognized; concerns linked to confirmed rule and exact expert quote/evidence. This fixture is a small synthetic HTML table. |
| Live actual planner edit | Passed | UI presentation assignee Jonas → Lea; activity evidence includes old/new values; server canonical plan stays Jonas while local draft is Lea. |
| Live actual planner screenshot | Passed | Real `/observe` produces a visible-assignee question. Did not return `customer_only` in the observed run; do not claim full constraint recognition. |
| Live structured edit → voice | Passed with quality issue | Agent identifies edited task and new person without either name in the probe, then asks multiple questions. |
| Six-answer learning through UI | Passed | 3 Capture + 3 debrief answers, guardrail, all six selected learned rule kinds, exact quotes and corresponding frame/answer evidence. Real OpenAI compilation. |
| Atlas unseen conflict and correction | Passed | Atlas Thu 09–11 overlaps Cohort Thu 09–13; finding specifically references learned `no_overlap` and two tasks; save disabled. Moving Cohort to Fri 08–12 passes; approved save in full view. |
| Skill export | Passed | Download completed, contains learned expert quotes, excludes session capability token. |

### Tested expert rules

`customer_only`, `review_buffer`, `no_overlap`, `blocked_followup`, `focus_block`, `availability`. The test asserts these appear in the actual compiled map; it does not infer them from screen-only evidence. Explicit source constraints remain distinct from learned rules.

## Live latency samples

| Operation | Observed duration | Interpretation |
| --- | --- | --- |
| Planner edit → persisted activity | 31–33 ms | Fast structured application evidence. |
| ElevenLabs connection | 847 ms | One setup sample per run; not speech onset. |
| Typed edit probe → grounded agent transcript | 967–972 ms | Text reply timing, not acoustic time-to-first-audio. |
| OpenAI observation of actual planner | 7,086–11,026 ms | Suitable for a question after a pause; too slow for immediate per-click feedback. |
| OpenAI visual coach fixture | 3,325 ms | Small explicit wrong-assignee screenshot; not a full planner latency benchmark. |
| Small synthetic map compilation | 4,947 ms | Simpler evidence than full six-rule case. |
| Six-rule UI map compilation | 14,931–15,437 ms | Needs clear progress feedback; not on the save-blocking path. |
| Controlled Atlas overlap check | 67–80 ms | Deterministic learned/source validation, independent of LLM latency. |

These are a few local samples, not percentile estimates or a load test. Screenshot size, provider load, output size and connection state vary. No comparison with another model or API was run.

Safe final measurements and synthetic provider text: [planner measurements](live-planner-measurements-2026-10-04.json), [learning measurements](live-learning-measurements-2026-10-04.json).

## Exact live behavior

OpenAI question after changing the actual planner's presentation assignment:

> Why is the client presentation assigned to Lea?

The voice probe did not name the task or either person. ElevenLabs identified `Finalize Client Presentation`, said the assignee is now `Lea`, and asked why it changed from `Jonas`. It also asked when to stop/escalate in the same turn. Thus context transfer succeeded, but the desired one-question-at-a-time behavior did not.

OpenAI `/observe` currently receives screenshots only. Structured planner edits go directly to ElevenLabs as untrusted `screen_event` context and persist as activity evidence. General external application click/shortcut observation is not established by the web planner tests.

## Optimization priorities before embellishments

1. **One question per turn.** Tighten and rehearse expert/tutor conversational instructions, remove repeated idle nudges, and assert question discipline in live tests. Review real audio before declaring this solved.
2. **Explicit analysis progress.** Distinguish screen shared, analyzing latest moment, question ready and map compiling. A 15-second compile should never look like an unresponsive button. Avoid invented progress percentages.
3. **Faster event-grounded questions.** Supply bounded structured planner events with the relevant screenshot to observation, while keeping all evidence untrusted and rule learning answer-based. Benchmark an alternative configuration before changing the model. Keep deterministic save validation independent.
4. **Keep task identity visible.** Horizontal scrolling to edit dates can hide task names. Pin the Task column or provide a focused task editor so the user and screenshot model retain identity alongside changed values.
5. **Finish the human rehearsal.** Real Chrome picker + microphone, spoken expert answers, pause timing and audible tutor turn-taking. Confirm the correct shared surface changes rather than relying on a static preview.

After these: subtle highlight on the changed cell, a single “question ready” indicator, answer evidence chips, a compact correction summary, and a tasteful completion state. These are proposed next additions, not implemented here.

## Production work still outside this result

User/team identity and authorization, cross-device skill storage, durable unsaved drafts, spend quotas/server inference rate limits, automatic evidence expiry, deployment and load/network-failure validation. Arbitrary external apps support advisory capture/coach rather than controlled pre-save interception. Native macOS capture permissions remain a separate unresolved integration.

## Reproduce

With local providers already configured in ignored server environment files and explicit authorization for paid synthetic tests:

```sh
npm run check
npm run test:api
npm run test:browser
npm run test:extension
npm run test:extension:runtime
npm run test:lease
RUN_LIVE_VOICE=1 npm run test:voice
RUN_LIVE_VISION=1 npm run test:vision
RUN_LIVE_LEARNING=1 npm run test:live-learning
RUN_LIVE_PLANNER=1 npm run test:live-planner
```

Final planner fixture verifies session deletion. Learning fixture cleanup is best-effort; it is not used as evidence of privacy deletion. Early stronger-frame test attempts failed because the canvas fixture did not emit the changed frame; explicit `requestFrame()` fixed that harness. The initial planner attempt passed provider checks but raced off-record during cleanup; its final rerun passed cleanup. Neither harness failure is described as a production regression.
