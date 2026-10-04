# Decision Echo

An AI apprentice that captures expert decisions, builds an evidence-backed Work Map, and coaches a learner through a new case.

The first connected implementation is a browser workspace for synthetic Notion weekly planning. Optional Chrome and macOS capture clients use the same session protocol. The architecture keeps capture, voice, learned policy and application adapters separate so additional applications can be added.

## Run locally

Use Node.js 22.12+ or a supported newer release and npm.

```sh
npm ci
npm run build
npm run dev:api
```

In a second terminal:

```sh
npm run dev
```

Open http://127.0.0.1:5173. The local Cloudflare API runs on port 8787. Choose **Start sandbox session**, share a synthetic planning window, record three real expert answers including a guardrail, and answer three new debrief questions. Review and confirm the Work Map, then open the unseen learner case. Proposal checks do not write to Notion; saving requires explicit human approval.

Without an OpenAI key, the sandbox compiles actual entered answers into selected, supported scheduling rule types. Configured real voice and vision also work with synthetic planning data, independently of the Notion connection. It does not simulate a live model or invent expert answers. Changed rule parameters, such as review-buffer minutes, affect validation; arbitrary policy induction is not claimed.

## Connect live providers

Copy `.dev.vars.example` to ignored `.dev.vars` and configure credentials locally. Browser login alone does not connect the application. Configure separate ElevenLabs expert/tutor agents with the selected v4 Turbo voice model, OpenAI backend access, and a Notion connection to the demo data source. Set `MODE=live` and `APP_ORIGIN` in runtime configuration; see [server setup](docs/server-setup.md) for availability and schema configuration. Never expose API keys in the browser or commit them.

Real ElevenLabs expert/tutor exchanges and Chrome window capture have been exercised with labeled synthetic narration. OpenAI vision and Notion writes remain **unverified until credentials are configured and those tests run**. This is a working local foundation, not a completed full-suite or hackathon-compliance claim.

## Verified and pending

Verified locally: TypeScript, deterministic scheduling and provider-safety tests, actual local Durable Object API integration, and the browser Capture → Map → Teach → blocked proposal → correction → explicit sandbox save journey. Browser automation uses a synthetic test stream; it does not verify OS screen-sharing permissions or hardware capture. Reload recovery, a tab-local confirmed-skill catalog, urgent-case completion, privacy leases and companion evidence polling are implemented. Extension privacy tests and isolated unpacked Chromium runtime checks pass. The native companion has a reproducible local app bundle; see its dedicated guide for the latest platform checks.

Pending: OpenAI/Notion integration, native hardware capture and toolbar-granted extension screenshots, multilingual tutoring, multiple-expert comparison, generalized task/person schemas, reconciliation UI, user/team authentication and deployment. Technical pre-save enforcement applies to our controlled write path; direct Notion autosave is outside it.

## Checks

```sh
npm run check
npm run test:extension
npm run test:extension:runtime
# With both local servers running:
node tests/api.integration.mjs
node tests/browser.integration.mjs
npm run test:lease
```

The browser test requires a Playwright Chromium installation (`npx playwright install chromium`). [Capture clients](docs/capture-clients.md) documents installation and remaining platform limitations. [Final review](docs/reviews/final-engineering-review.md) and [implementation results](docs/reviews/implementation-results.md) and [suite validation](docs/reviews/suite-validation.md) separate review, build and runtime evidence. The opt-in `RUN_LIVE_VOICE=1 npm run test:voice` test consumes configured ElevenLabs usage; it uses explicitly synthetic text and a muted fake microphone.

## Contribution and publication

Start with [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md), [agent bootstrap](docs/agent-bootstrap.md) and [publication policy](docs/publication-policy.md). The coordinator owns contracts and integration; specialists receive bounded modules.

The private knowledge checkout is independent of this repository. Private source materials, recordings, wiki, credentials and real workspace identifiers stay out of product history. Use synthetic data for public demonstrations.
