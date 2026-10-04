# Gemini observation activation — 2026-10-04

User-approved active local routing: Gemini 3.5 Flash-Lite through Google Cloud Agent Platform, EU multi-region, minimal thinking and JSON output for Capture/debrief screenshot questions. ElevenLabs remains the voice interviewer/tutor; OpenAI Sol remains Work Map compilation and learner visual coaching. This is a local change; no deployment or push occurred.

## Implementation

Added server-only Vertex adapter with OAuth, permitted service-account-bound key and express-key modes; validates model/project/location/image, uses fixed Google destinations and parses non-thought JSON. Selected Gemini fails explicitly when configuration, auth or output fails, with no automatic OpenAI fallback. Credential headers and provider error messages are not exposed to the browser. Vision capability and UI gating now track the selected observation provider independently of OpenAI map/coaching access.

Worker runtime initially rejected the request with `redirect:error`. Manual redirect handling succeeded in the real Worker; non-2xx redirects are rejected by `providerFetch`, so no follow-up request forwards credentials or pixels. Mocked tests verify 302 failure, a single fetch, malformed config/output and routing. Independent review confirmed the adapter, isolated model routing and UI gating; its UI finding was fixed.

## Actual verification

Typecheck, 113 unit tests and production build passed. Build still reports a large bundled UI chunk; this change does not resolve that existing size warning. API regression passed authentication, held-out isolation, provenance, off-record epochs, map gate, planning correction and duplicate-save checks. General isolated browser regression passed synthetic capture, paused/active reload recovery, Capture/debrief, confirmed Work Map, learner mistake/correction, local save, skill download, library and capability cleanup. The first browser attempt was interrupted during integration reloads; the final clean rerun passed.

Live browser planner test passed with the configured Gemini through `/observe` and actual ElevenLabs connection: changed presentation assignee Jonas → Lea; edit evidence in33ms; real screenshot question in2000ms; ElevenLabs correctly named the edited task and Lea in981ms. Required-assignee rule kind returned. Local draft did not autosave the server plan. No browser runtime errors; disposable session deleted. [Measurements](live-planner-measurements-2026-10-04.json).

This live test uses synthetic planner data, typed labeled replies and a fake muted microphone. Display-media permission uses a static canvas fixture; actual rendered planner pixels are separately supplied to the real observation endpoint. It does not verify human ASR, OS permissions or continuous desktop capture.

## Access lifetime

Current local Google access is a short-lived OAuth token in ignored `.dev.vars`, not a renewable production identity. Refresh is required after expiration. Cloud deployment must first configure durable server-side authentication; no credentials were published or placed in source. [Google authentication options](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys).
