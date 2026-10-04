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

Copy `.dev.vars.example` to ignored `.dev.vars` and configure credentials locally. Browser login alone does not connect the application. For the current self-contained demo, keep `MODE=sandbox`: that selects synthetic planning data while real ElevenLabs voice, Gemini screenshot observation and OpenAI map/learner coaching remain active when configured. Gemini uses Google Cloud EU endpoints; current local OAuth tokens expire and require refresh. Notion credentials are optional and are only needed for the separate Notion adapter mode.

Configure `ELEVENLABS_API_KEY`, separate expert/tutor agent IDs and `OPENAI_API_KEY`; use account-accessible models. Defaults use `gpt-6.1-sol` for Work Map compilation and learner visual coaching, and Vertex `gemini-3.5-flash-lite` with minimal thinking for short screenshot observations. The optional OpenAI observation route uses `gpt-6-luna` with low reasoning/high image detail. See [server setup](docs/server-setup.md) for workload overrides and [local comparison](docs/reviews/luna-sol-comparison-2026-10-04.md) for measured limits. Configure the selected v4 Turbo voice on both ElevenLabs agents. Keep keys server-side and out of Git.

For a concrete rehearsal showing an unseen-case mistake, correction and changed expert rule, follow the [demo walkthrough](docs/demo-walkthrough.md). The workspace shows saved interview progress and lets you compare each rule with its linked expert evidence.

## Verified and pending

The [Gemini activation review](docs/reviews/gemini-observation-activation-2026-10-04.md) records the current provider routing and a real Gemini/ElevenLabs synthetic planner integration test.

The [live web validation report](docs/reviews/live-web-validation-2026-10-04.md) records an actual Chrome screen-share run with real OpenAI observation/compilation, both ElevenLabs agents, six explicitly synthetic typed answers, confirmed map, a blocked learner mistake, correction, explicit local save and downloaded skill. A real microphone transcript was not tested in that run. Model output remains advisory until reviewed; supported scheduling operators, rather than arbitrary prose, drive controlled validation.

Local automated checks cover TypeScript, source constraints, learned scheduling rules, provider safety, isolated Durable Object APIs, recovery, stale revisions, capture leases, browser workflow, off-record behavior and skill export. Each report distinguishes mock media/provider fixtures from actual provider calls. Optional capture clients have separate [platform verification](docs/capture-clients.md).

Still pending for a production team service: authenticated accounts and cross-device skill synchronization, production deployment and rate limits, real human microphone end-to-end verification, generalized task/person schemas and broader browser/OS coverage. Native macOS capture permission remains a separate platform gate. Real Notion writes remain unverified and are not required for this sandbox demo. Our controlled planner has an explicit save gate; direct Notion autosave remains outside it.

Public deployments require `DEMO_ACCESS_CODE` before new sessions can be created. This is a shared demo gate, not per-user authentication. The server fails closed for a non-local `APP_ORIGIN` without that secret. Set the exact deployed origin and configure secrets before opening the demo to others.

## Checks

```sh
npm run check
npm run test:extension
npm run test:extension:runtime
# Isolated tests (no provider credentials or shared database):
npm run test:api
npm run test:browser
# With the local API running:
npm run test:lease
```

The browser test requires a Playwright Chromium installation (`npx playwright install chromium`). [Capture clients](docs/capture-clients.md) documents installation and remaining platform limitations. [Final review](docs/reviews/final-engineering-review.md) and [implementation results](docs/reviews/implementation-results.md) and [suite validation](docs/reviews/suite-validation.md) separate review, build and runtime evidence. The opt-in `RUN_LIVE_VOICE=1 npm run test:voice` test consumes configured ElevenLabs usage; it uses explicitly synthetic text and a muted fake microphone.

## Contribution and publication

Start with [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md), [agent bootstrap](docs/agent-bootstrap.md) and [publication policy](docs/publication-policy.md). The coordinator owns contracts and integration; specialists receive bounded modules.

The private knowledge checkout is independent of this repository. Private source materials, recordings, wiki, credentials and real workspace identifiers stay out of product history. Use synthetic data for public demonstrations.

## License

Copyright © 2026 the Decision Echo authors. All rights reserved.

This repository is published for review of a hackathon submission. No license is granted: you may view the code, but you may not copy, modify, distribute or use it without prior written permission.
