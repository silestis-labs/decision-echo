# Server setup and operating boundaries

The server is a Hono Cloudflare Worker with one SQLite-backed `EchoSession` Durable Object per session. Session state and write journals persist across restarts. Bearer capability plaintext is returned once at creation; storage retains its SHA-256 digest. The browser should keep the capability in memory and never send it in URLs.

Run `npm run cf:types` after binding changes, `npm run dev:api` for local API development and `npm run dev` for the web UI. The primary owns manifests and Wrangler configuration. Do not deploy or expose real records before approved provider access and application tests.

## Configuration

Use local ignored `.dev.vars` or Wrangler secret commands under the authorized deployment scope. Never commit real values.

- `OPENAI_API_KEY`: enables real Responses calls; `OPENAI_MODEL` must name a model actually available to your account.
- `ELEVENLABS_API_KEY`, `ELEVENLABS_EXPERT_AGENT_ID`, `ELEVENLABS_TUTOR_AGENT_ID`: separate configured ElevenAgents roles; [setup prompts and checks](elevenlabs-agent-setup.md). Signed URLs are minted server-side; keys never reach the renderer. Configure agent tools, Expressive Mode and intended voice in ElevenLabs. Returning a signed URL does not itself configure those settings or prove account access.
- `NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID`: a connection shared with the specific data source and permitted to read/write its pages.
- `NOTION_AVAILABILITY_JSON`: explicit JSON array `{person,skill:string[],start,end}` with offset ISO dates. Live mode refuses synthetic availability defaults.
- `NOTION_PROPERTY_MAP`: optional JSON mapping contract field names to actual Notion property names.
- `APP_ORIGIN`: exact web application origin. `EXTENSION_ORIGIN`: optional exact `chrome-extension://<id>` origin. No wildcard CORS. CLI/native requests without Origin still require the bearer capability.

## Notion schema

Default property mapping:

| Field | Notion name | Type |
|---|---|---|
| title | Task | title |
| skill | Required Skill | rich_text/select |
| effort | Effort (h) | number |
| deadline | Deadline | date with time and offset |
| priority | Priority | select P0 · Urgent, P1 · High, P2 · Normal, P3 · Low |
| customerPreference | Customer Preference | rich_text/select |
| dependencyStatus | Dependency Status | select: Ready, Waiting, Blocked |
| dependencyAvailableAt | Dependency Available At | date or empty |
| focus / external | Flags | multi_select Focus Work / Review Required |
| assignee | Proposed Assignee | select: Lea, Jonas, Mira, Unassigned |
| start / end | Start / End | date or empty |
| reviewOwner | Review Owner | select: Mira, None |
| reviewStart / reviewEnd | Review Start / Review End | date or empty |
| followUpOwner | Follow-up Owner | rich_text |
| followUpCheckpoint | Follow-up Checkpoint | date or empty |
| decision | Decision | select: Schedule, Split, Request information, Escalate, Hold |

TrainingStage is a select: Training 1..3 rows feed capture; Tutor Test rows are withheld until Teach; Advanced Test rows are excluded. Review Status and Final Confirmed remain outside current writable adapter properties.

This application contract currently uses named demo roles, not arbitrary Notion people IDs. Real workspace data must be deliberately mapped to these roles; do not claim support for arbitrary workforce schemas. Missing properties fail rather than silently fill expert context. Only planning fields are writable; task effort, priorities, dependencies and customer constraints remain server-authoritative. Whole-plan submissions must contain exactly the session's task IDs.

Live reads query the configured **data source**, paginate to a bounded 200 tasks and re-read before validation/commit. External changes reject the proposal. Date readback and stale-source comparison normalize equivalent offsets to instants. Writes update only defined properties and independently retrieve each page to verify them. Notion does not offer a transaction spanning these page writes. Concurrent external edits between checks remain a limitation.

## Learning and controlled save

Sandbox refers to synthetic planning data and local writes. Real ElevenLabs voice and OpenAI observation can be used with that data when their keys are configured, independently of Notion. Without a backend model key, its deterministic compiler binds manually entered expert answers to selected supported rule types. It is not an AI training claim. The Atlas learner case stays hidden from browser session responses until Teach.

Configured observation and compilation use actual OpenAI Responses in either data mode. No model error is replaced with a supposedly learned synthetic map. Compilation supplies only captured expert evidence/answers, never the task schedule or hidden learner case. Three distinct capture answers including a guardrail and three new debrief answers are required, followed by a draft map with real evidence references and exact expert quotes. The user must explicitly confirm the exact version. Map edits invalidate confirmation.

Pause increments the epoch. Frames have a 550KB encoded limit and a 32MB total retention budget per session, stored separately from session metadata. Frames arriving from old epochs are rejected; model observation results are discarded after an epoch change. This is a server upload/result boundary, not proof that a remote native collector stops synchronously before its next poll. The client must stop all sensors/uploads immediately on its own pause action.

Commit requires a confirmed map, current plan revision, human confirmation and successful whole-plan validation. A persisted writing state and per-page journal prevent blind replay. Each write is attempted once. Provider failure or mismatched readback yields partial/unknown state; do not automatically retry. Operators must reconcile real Notion state before a new attempt. The journal is available through authenticated GET `/api/sessions/:id/journal`; it provides forensic evidence, not an implemented reconciliation UI. A restart during a write leaves `writing` as a fail-closed operator-reconciliation state.

## Verification status and limits

Meaningful unit checks cover body bounds, capability hashing, rejecting remote frame URLs and one-attempt provider writes. Provider-account calls, live ElevenLabs conversation, Notion persisted writes and actual learning transfer require configured credentials and runtime tests; documentation review is not that verification. Origin and schema checks do not replace deployment-level rate limiting or user authentication. A session capability authorizes its session only; anyone allowed to create sessions can consume configured provider resources, so production ingress needs an access policy.

Checked primary docs on 2026-10-04: [Cloudflare SQLite storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [Notion Update page](https://developers.notion.com/reference/patch-page), [Notion data source query](https://developers.notion.com/reference/query-a-data-source), [ElevenLabs signed URL](https://elevenlabs.io/docs/api-reference/conversations/get-signed-url). Data-source query page exceeded the browser text limit; runtime endpoint/schema validation remains required.

OpenAI Responses create-reference fetch also exceeded the text browser limit; the implemented endpoint must be account/schema-tested before live claims.


## Frame response and live mode configuration

Session storage loads metadata only. Normal session responses include at most the latest stored frame image; clients should cache that image and lazily fetch older replay assets through authenticated `GET /api/sessions/:id/frames/:evidenceId`. Each asset is scoped to that session's recorded frame IDs. This avoids reloading and returning all accumulated pixels on every upload or Notion check. Live compilation intentionally uses frame descriptions and answers, not pixel assets or learner tasks.

The bounds are 550KB per encoded frame, 32MB encoded retention per session, and 300 total evidence entries including expert answers and activity. They are explicit resource limits, not a guarantee that every dense application can retain ten minutes of frames. Clients need sensible downscaling/sampling and a clear retention-limit message.

For a fully configured live installation set `MODE=live`, actual `OPENAI_MODEL` and `ELEVENLABS_VOICE_MODEL`, exact `APP_ORIGIN`, optional exact `EXTENSION_ORIGIN`, and the provider keys/agent IDs/Notion configuration listed above. MODE changes the advertised default; creation still explicitly supplies `{mode:"live"}`. Keep local secrets in ignored `.dev.vars`; production values belong in approved Worker secrets. Configuring variables is not proof of working provider access.

Signed voice URL requests require active recording. The server rechecks recording and capture epoch after minting and discards stale authorization responses if another client paused. Already issued provider sessions still require client-side microphone/disconnect handling; server checks do not remotely revoke them synchronously.
