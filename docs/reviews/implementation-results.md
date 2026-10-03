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
