# Implementation admission review

Reviewed 2026-10-04. The user selected the supplied Notion planning sandbox and authorized implementation. This is an ordinary engineering review informed by gstack guidance, not completion of gstack's interactive review workflow.

## Architecture

React browser workspace owns the controlled proposal editor. A Hono Worker routes requests to one SQLite-backed Durable Object per session. The session owns capture epochs, expert answers, evidence, reviewed map versions, proposal revisions and commit recovery. ElevenAgents handles interviewer/tutor voice; a separately configured OpenAI Responses adapter handles vision and compilation. Notion remains the application of record. Optional Chrome and macOS clients enrich the shared evidence protocol.

Capture → screen evidence → expert answers → distinct debrief → draft map → expert confirmation → unseen learner case → whole-plan validation → explicit human approval → adapter write → read-back.

Findings resolved before implementation:

- Notion autosaves its editor. Put the learner's proposal in our controlled editor; validate before issuing any Notion writes. A checkbox cannot create a pre-save guarantee.
- Do not introduce the learner's held-out case in the expert debrief or model compilation input. Debrief asks new hypothetical questions about missing judgment.
- Validate displaced production and review bookings against the complete schedule. The new task alone is insufficient.
- Read live data-source schema rather than assuming database IDs are interchangeable with data-source IDs. Support review and follow-up fields.
- A confirmed map is immutable for a tutoring decision; edited maps become a new draft version. Save rechecks current versions and plan state.
- Notion batch writes are not atomic. Journal each attempted write and read back uncertain results. Report partial/unknown outcomes; never pretend a partially applied plan committed successfully.
- Server credentials stay server-side. Random per-session bearer capabilities protect session access. Browser origin checks supplement authorization.

## Code quality

Shared Zod schemas and deterministic scheduling functions prevent divergent client/backend rules. Expert-selected or model-proposed rule kinds require actual answers and evidence; sandbox execution must not manufacture expert quotes. Typed rule parameters permit changed-policy evaluation. Provider failures remain visible; sandbox is explicitly separate from live inference.

## Verification

Test the double booking, independent review, blocked dependency, wrong required assignee, changed review buffer, unconfirmed map, malformed evidence and stale epoch. Exercise the complete browser journey and controlled commit. Live provider quality and Notion write verification require credentials and are separate from deterministic/local checks. Capture consent and native permissions require actual interaction, not a build result.

## Performance and recovery

Capture at two-second cadence with one upload in flight, bounded images, abort on local pause, and server rejection of stale epochs. Never queue an unbounded recording. Local pause immediately stops local tracks and voice; other connected clients learn the shared stop through polling, while the server denies outdated uploads. Already delivered provider data cannot be recalled.

## Agent assignments

| Lane | Exclusive ownership | Dependency |
|---|---|---|
| Coordinator | Shared schemas, domain policy, manifests, integration, tests and wiki | None |
| Backend specialist | `src/server/`, backend setup | Frozen shared/domain contract |
| Interface specialist | `src/ui/`, `index.html` | Frozen API contract |
| Capture specialist | `apps/`, capture-client guide | Session epoch/evidence contract |

A later independent review examines consequential implementation and reports actual findings before delivery. Cross-platform execution, provider evaluations and deployment remain distinct checks. Full suite architecture remains in scope; installed optional clients are not prerequisites for the browser demo.

## GSTACK REVIEW REPORT

Architecture, code quality, verification, and performance were assessed using gstack engineering-review guidance. Interactive gstack gates and global bookkeeping were not executed. This document authorizes no deployment or repository visibility change. Implementation and runtime results must be reported separately.
