# Implementation results

Checked locally on 2026-10-04. This records implementation and verification separately from challenge compliance. No deployment or live workspace mutation was performed.

## Connected implementation

React/TypeScript browser workspace, Hono Cloudflare Worker, per-session SQLite Durable Object, typed scheduling operators, and separate ElevenLabs/OpenAI/Notion adapters are connected. Expert answers bind exact words to captured frames and server-owned answer evidence. Maps require distinct capture/debrief questions, a guardrail and explicit version confirmation. The learner case stays hidden until Teach. The controlled proposal editor checks the complete plan and requires explicit human approval before committing.

Ordinary session responses return only the latest image; older evidence loads through a bearer-authenticated endpoint. Capture sampling allows one upload in flight, with 550KB/frame, 32MB retained images and 300 evidence items/session. Local pause stops local screen tracks and voice and aborts uploads. Server epochs reject outdated uploads/results; connected-client stop latency is polling-dependent.

## Actual checks

| Check | Result and evidence |
|---|---|
| TypeScript | `npm run typecheck` passes |
| Domain/provider tests | 14 checks pass across `src/**/*.test.ts`: conflicts/correction, changed buffer, preference vs restriction, dependencies, review, map/evidence gates, body bounds, tokens and provider no-retry behavior |
| Actual local Worker API | `tests/api.integration.mjs` passes against Wrangler: capability auth, held-out isolation, evidence provenance, pause epoch, confirmed map, invalid commit rejection, full correction, stale revision, concurrent duplicate commit |
| Browser journey | `tests/browser.integration.mjs` passes: capture → six expert answers across capture/debrief → confirm map → unseen case → conflict warning/disabled save → correction → explicit sandbox save; no browser page errors |
| Optional extension | `node apps/chrome-extension/panel.test.mjs` passes mocked pause/epoch/loopback checks; syntax/manifest parse pass |
| Optional macOS companion | Swift package builds with temporary caches; hardware capture and permissions unverified |
| Worker bundle | `wrangler deploy --dry-run` passes without deployment |
| Production bundle | `npm run build` passes; ElevenLabs SDK currently produces a large (~920KB uncompressed) bundle warning |
| Dependencies | Installed versions are pinned with a lockfile; audited installation reported zero known advisories after updating the test runner |

Browser automation supplies a **synthetic canvas stream** in place of OS screen capture. It tests application lifecycle and actual local backend behavior, not real screen-sharing permissions, live voice or model quality. API fixtures are test evidence, not genuine expert demonstrations. The changed-policy evaluation covers supported typed parameters; arbitrary rule induction is unproven.

## Remaining product and demo work

Live ElevenLabs expert/tutor agents must be configured with the user-selected v4 Turbo voice and actual prompts/tools. Configure the keys/IDs, backend model access, Notion data source and explicit availability before claiming the voice/vision/Notion path works. Real browser capture, Chrome permissions and macOS TCC capture need hands-on checks.

The current scheduling binding uses supplied role names and a finite rule vocabulary. Generalized teams/applications, multi-expert comparison, multilingual evaluation, shared skill-library discovery, multi-user authentication, reconciliation UI, long-term evidence storage and deployment remain further implementation work. Configured voice and vision can be tested on synthetic planning data before enabling Notion. The first connected journey is not completion of the entire full-suite roadmap or proof of every challenge gate.

Notion writes are journaled and read back per page; they are not atomic across the plan. External edits between the fresh read and individual writes remain a limitation. Unknown/partial outcomes block blind retry and require reconciliation. Direct edits in Notion can autosave and are outside our controlled pre-save guarantee.

## First user voice test and capture corrections — 2026-10-04

A real user session produced a live ElevenLabs transcript and 111 screen frames. DOM inspection found five distinct image payloads; first and last frames matched. This supports successful sampling of a mostly unchanged selected surface, not a claim that every intended external window was selected. OpenAI vision was unconfigured, so images were evidence only and were not interpreted by the voice agent. Both agent signed-URL authorization calls returned HTTP 200 after enabling ElevenAgents Write (`convai_write`); Read alone returned `missing_permissions`.

The installed React SDK's `startSession` returns void. Awaiting it did not wait for connection readiness, and immediate contextual updates caused the observed “No active conversation” error. Context delivery now waits for connected state and uses the latest conversation controls during asynchronous sampling. Unit checks cover delayed readiness, one-time delivery, debrief triggering and cleared pending context. A fresh live voice reconnection is still needed to confirm this fix with the provider.

Capture now shows the selected track label, latest captured image and sample checks. It saves changed image payloads instead of repeated identical frames; the capture stream itself continues checking every two seconds. Pausing retains the visible unsaved question, answer and transcript while stopping sensors/uploads; these drafts remain browser memory, not durable saved answers. Work Map before sufficient Capture evidence has a separate prerequisite view. Library explicitly describes its current single-session export scope. The browser regression uses an animated synthetic capture stream to verify distinct captured image payloads, prerequisite navigation and unsaved-answer preservation; it does not simulate an actual OS picker.

## Authorized synthetic run with real ElevenLabs agents — 2026-10-04

The user authorized an automated simulation including the real ElevenLabs interviewer/tutor. Native Chrome computer use drove the actual application and shared only its synthetic planning window through Chrome’s Window picker. Chrome’s Tab picker was empty for the single current tab; Window capture succeeded. This is a real browser window-capture observation, separate from the automated canvas fixture test.

A sandbox-only simulation control was added for typed replies to the connected real voice agent with controlled microphone muting. Input is labeled `[Synthetic test narration]` in saved answers and the export. This verifies typed messages and live agent responses/TTS, not synthesized microphone injection or speech recognition. The React readiness fix no longer produced the earlier no-active-conversation error during this run.

Three Capture answers and three debrief answers were saved with real captured frames. The deterministic compiler generated `no_overlap` and `customer_only` rules; they were reviewed and confirmed for this synthetic test, not confirmed by a human domain expert. The unseen learner dataset was opened. Assigning the presentation to Lea triggered the customer-only rule, preserved the unsaved proposal and disabled save. The real ElevenLabs tutor explained the Jonas requirement. After correction to Jonas, validation passed and explicit sandbox commit succeeded. The reviewed skill downloaded and contained both operators and synthetic labels. Completed provider conversation records confirmed synthetic inputs and real agent messages; the tutor transcript included Jonas. Conversations and screen capture were stopped. No Notion workspace was changed.

Limitations exposed: controlled native date fields were unreliable during segmented keyboard entry; an attempted Atlas overlap setup was reset rather than counted as a successful test. The client-assignee mistake was the verified intervention. Atlas remained held, so this run does not prove solving the full urgent-case schedule. Validation permits that hold under the selected rules, which needs product review if urgent-case completion is required. Capture of its own preview creates visual feedback, so changing frame count does not necessarily mean task changes. Debrief questions repeated some earlier themes; idle follow-ups were frequent. Tutor transcript exists in memory/provider history but is not displayed in Teach. OpenAI vision/compilation and real Notion writes remain unconfigured.
