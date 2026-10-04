# Suite validation — 2026-10-04

The browser, Worker, extension and macOS companion share an authenticated capture session. This report separates implemented behavior, automated evidence, real provider exchanges and OS-dependent checks. It is not a deployment or hackathon-score claim.

## Implemented changes

- Browser sessions recover from tab-scoped credentials and server state. Recovery and reopening explicitly pause capture. Confirmed skills from multiple sessions can be reopened within that tab. Permanent session deletion is separate from forgetting tab access.
- Native date inputs preserve segmented editing and commit complete values on blur. Invalid partial/ancient dates cannot replace the proposal. The unseen urgent case must be scheduled or explicitly escalated with an accountable checkpoint.
- Tutor connection context includes the current unseen case, unsaved proposal and existing findings. Teach displays the live conversation and cumulative practice checks; counts do not establish mastery.
- Companion mode receives external frames through authenticated polling. Browser and native clients refresh a 60-second recording lease. Stale epochs are rejected, abandoned capture expires, delayed activation is compensated after off-record, and queued captures cannot cross local stop/restart.
- The Chrome extension has bounded selected-tab capture, generic activity categories, explicit screenshot consent, memory-only credentials and navigation/remote-pause stop behavior.
- The macOS app has reproducible local packaging, explicit connection import, selected-window frame sampling, bounded JPEG uploads and separately consented generic external activity. It requires macOS permissions; local ad-hoc signing is not distribution notarization.

## Actual verification

| Check | Evidence | Limit |
|---|---|---|
| TypeScript, unit checks, production build | `npm run check`: 35 tests across nine files; build passes | ElevenLabs vendor bundle remains about 941KB uncompressed |
| Actual local Worker API | `npm run test:api`: auth, held-out isolation, evidence integrity, lease renewal/stale rejection, urgent completion, correction, duplicate commit, progress and deletion | Synthetic data; no live Notion writes |
| Actual lease expiry | `npm run test:lease`: 60-second abandonment expiry, epoch change, paused canary rejection and evidence deletion | Does not remotely revoke a provider voice connection |
| Browser journey and regressions | `npm run test:browser`: Capture → Map → Teach, blocked overlap → full correction → save, export/library/reload, delayed picker/activation pause, invalid dates, companion polling/heartbeat, reopening recording session, delete cancel/confirm | Canvas substitutes for OS screen sharing |
| Chrome privacy tests | `npm run test:extension`: late-frame restart, screenshot consent revocation, pause, bearer transfer and heartbeat | Mocked Chrome/network interfaces |
| Real unpacked MV3 | `npm run test:extension:runtime`: actual isolated Chromium injection/HTTP, no typed values, local/remote stop, navigation, forget and enforced screenshot permission denial | Synthetic backend; positive toolbar-granted screenshots not proven |
| Real MV3 → Worker | `npm run test:extension:worker`: actual isolated Chromium and disposable Wrangler/SQLite state, exact-origin CORS, bearer authority, generic activity evidence, heartbeat and stale-epoch rejection | No provider secrets or calls; positive toolbar-granted screenshots still pending |
| Real ElevenLabs expert/tutor | `RUN_LIVE_VOICE=1 npm run test:voice`: actual WebSocket sessions and agent replies, synthetic typed narration, tutor receives pre-existing blocked-case context, disabled save and off-record cleanup | Fake microphone device is muted; no speech-recognition or human expert-learning claim |
| macOS core/build/UI | Five Swift tests, release `.app` packaging, plist/ad-hoc signature checks and native UI launch | Hardware frames/input still require OS permissions |

The live voice test is deliberately opt-in and consumes configured account usage. It cleans up its synthetic local session and closes voice connections. Tests do not print provider keys or signed URLs.

## Independent review

Separate agents reviewed backend and browser/Mac changes. Findings prompted capture-generation fences after asynchronous activation, fresh bounded pause on recovery/reopen, truthful local stopped state on failures, native partial-date validation, initial tutor grounding, frozen native connection snapshots, token binding/header validation and preservation of uncertain write journals. Follow-up verification is required after later code changes.

## Release blockers and boundaries

- The final ad-hoc signed Mac build still reports screen capture ungranted despite the system settings switch. Hardware testing captured zero frames. Native rebuilds and permission troubleshooting are paused while browser visual Teach is prioritized. Accessibility and Input Monitoring are unverified.
- OpenAI is configured and one real synthetic visual coaching flow passed on 2026-10-04. Live Notion read/write remains unverified; no real workspace mutation was performed.
- Toolbar-granted extension screenshots and installed extension-origin configuration need a consenting browser runtime check. Tests preserve minimal permissions rather than granting all-site access.
- Cloudflare deployment, production user/team authentication, hosted companion connections, notarized distribution and account-synchronized library remain release work. Native/extension endpoints currently accept HTTP loopback only.
- The planning adapter uses named demo roles and finite scheduling operators. Other apps can be observed, but arbitrary app execution, universal save interception and model-weight training are not implemented.
- Partial/unknown Notion writes remain fail-closed with a read-only journal; operator reconciliation is required. Deleting a session does not undo provider or application-side records.

Setup: [server](../server-setup.md), [Chrome](../chrome-extension.md), [macOS](../macos-companion.md), [historical implementation evidence](implementation-results.md).

## Live OpenAI verification — 2026-10-04

`RUN_LIVE_VISION=1 npm run test:vision` passed against the actual local Worker and Responses provider using a synthetic rendered planner. The provider extracted a map from six synthetic typed expert answers, the map was confirmed, and learner screenshot coaching identified the visible Lea assignment against the Jonas-only rule. Returned quotes and evidence IDs matched the trusted map. The disposable local session was paused and deleted. This proves provider connectivity and one synthetic visual case, not live Notion writes, human expertise or OS capture.

The test exposed and fixed JSON-mode input requirements and explicit exact-quote/frame-and-answer provenance instructions. The deterministic API suite requires a credential-free Worker; running it against the newly configured model changes compilation behavior and its fixture does not support its labeled eight rules. That baseline run failed and must be repeated in isolation.

### GPT-6.1 Sol verification

The user requested verification of `gpt-6.1-sol`. The official model page confirms Responses and image-input support. A separate local Worker with that exact model and configured credentials passed real expert map compilation and grounded learner screenshot coaching using the same synthetic fixture. `wrangler.jsonc` now selects `gpt-6.1-sol`. This is a compatibility check on one case, not a comparative quality benchmark. The deterministic API regression subsequently passed in a credential-free isolated Worker.

### First measured latency sample

On the local Worker using `gpt-6.1-sol` at its default reasoning effort, the synthetic expert-map compile took 5,699 ms and learner visual coaching took 3,818 ms end to end. Both passed provenance and wrong-assignee assertions. This is one sample, not a percentile or service guarantee. Capture and voice run independently; the serial visual queue starts requests at least five seconds apart. Controlled save validation is deterministic and does not wait for screenshot inference. No official OpenAI product named Decisions API was established by the documentation search; the implementation uses Responses. Lower reasoning effort is a candidate to evaluate, not yet configured or benchmarked.

### Correction: Decisions API announcement

A subsequent primary-source review confirms Decisions API in OpenAI's September 29 DevDay recap: https://openai.com/index/devday-2026-recap/ . It uses Luna with bounded questions/predefined answers and text or image context, announced as limited preview. The earlier documentation search was incomplete. Its current endpoint/schema, account access and latency remain unverified; the existing Responses integration remains active. A future triage adapter could decide whether to ask/explain/wait while detailed explanations stay with Sol and controlled save policy stays in code.
