# Client Report expert-rule verification

The generic `client_work_window` operator constrains external production work for a reviewed person to whole-hour Europe/Berlin start/end bounds. Bounds are explicitly reviewed before confirming the Work Map. No hotline reason or afternoon rule is inserted into task facts or tutor prompts.

For sandbox sessions with this confirmed operator, Teach replaces the held-out Atlas task with Client Report: four hours, preference for Jonas, due Friday 9 October at noon, Mira review Friday 09:00–10:00. Client Report is created only on entering Teach. Existing sessions without the operator retain Atlas.

The morning proposal (Jonas Thursday08:00–12:00) fits ordinary supplied constraints. It is blocked only by the learned window with the expert quote and source links. Thursday13:00–17:00 passes and still requires explicit save approval. Changing reviewed hours to08–17 changes the outcome. Internal work and other people are outside this operator's scope. Exceptions and cross-midnight windows are not supported.

## Checks

- `npm run check`: TypeScript, 127 tests and build passed. Existing bundle-size warning remains.
- Existing `npm run test:integration` sequence: API, original browser, extension panel and unpacked extension runtime passed.
- `npm run test:client-report`: added to the integration sequence; isolated full browser test verifies capture provenance, held-out reveal, morning failure with exactly one learned finding, disabled save, correction and explicit save.
- `RUN_LIVE_LEARNING=1 CLIENT_REPORT_LIVE_ORIGIN=<isolated local provider Worker> node tests/client-report.integration.mjs`: passed with real configured OpenAI compilation, synthetic expert answers/image and browser actions. Test session deleted. No voice or ASR test in this run.
- Independent source review and seven new domain tests passed. Review found and corrected missing minute formatting and an unsupported midnight bound. An initial real compiler result failed provenance validation; explicit source bindings were added to its input without weakening validation.

The deterministic fallback requires the same quoted answer to name one person and an explicit range such as13:00 to17:00. Natural-language compilation relies on model interpretation and expert parameter review. The window is a supported reviewed policy operator, not generalized learning of arbitrary company rules.

No original-audio evidence playback is implemented. Evidence is screenshot and expert text. Synthetic participant voices must be labeled as reenactment; real agent output must not be fabricated. This branch retains the UI simplification and does not include the separate unapproved privacy notice branch. The hosted deployment and its limits are recorded below.


## Hosted configuration repair

The hosted screen observer failed because Vertex API-key authentication mode and project binding were missing. The deployment origin also pointed to localhost. Persisted `VERTEX_AUTH_MODE=api_key` and the hosted `APP_ORIGIN` in Wrangler configuration; supplied the project through a server-side secret binding. No credential value is committed.

`npm run check` passed again (127 tests, typecheck and build). `npx wrangler deploy` published version `45e22103-1f7e-4450-924e-cfda72800eae`. Hosted configuration reports Gemini vision enabled and demo access required. A disposable authenticated synthetic session uploaded a planner screenshot and received HTTP 200 from real Gemini observation in 9.48 seconds: “Why is Finalize Client Presentation assigned to Jonas?” The test session was deleted. This verifies provider connectivity and one relevant observation, not a latency guarantee or a fresh microphone test. The separate privacy PR was excluded. Main was not merged.
