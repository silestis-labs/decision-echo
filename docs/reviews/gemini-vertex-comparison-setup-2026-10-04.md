# Gemini through Google Cloud Agent Platform — comparison setup

## Current status

The user confirmed Google Cloud / Vertex AI as the Gemini access platform on 2026-10-04 and explicitly authorized Cloud Shell authentication and temporary OAuth export to ignored local configuration. Transfer completed without printing the token; the local download copy was removed. The live EU multi-region benchmark completed 12 requests per provider. Gemini 3.5 Flash-Lite minimal: median **789 ms**, range 589–1,794 ms. Luna low/high image detail: median **3,753.5 ms**, range 2,593–5,431 ms. Gemini had roughly **79% shorter response time** in this pilot. Both providers returned HTTP 200 for all 12 requests.

Automatic checks passed Gemini 12/12 and Luna 11/12. Manual review found Gemini 12/12 questions grounded, including 6/6 changed-assignee cases; Luna incorrectly treated the Thursday cohort block as Wednesday in rounds 7 and 8 (10/12 grounded). The automatic check counts are not accuracy scores. The runner exited with its quality-failure status because one Luna question failed a heuristic; all requests completed and its disposable session was deleted. [Measurements and reviewed questions](gemini-luna-benchmark.json).

At benchmark completion, app routing remained Luna; the benchmark itself makes no provider switch. The user subsequently approved Gemini observation, now integrated and verified through the local Worker; see [activation review](gemini-observation-activation-2026-10-04.md). The evidence supports Gemini as the next observation integration candidate, pending broader screenshot cases and capture-to-question/voice timing checks. Temporary OAuth is test access, not a production authentication solution.

The initial attempt failed with HTTP 400 because this adapter incorrectly used `eu-aiplatform.googleapis.com`. Corrected multi-region hosts are `aiplatform.eu.rep.googleapis.com` and `aiplatform.us.rep.googleapis.com`; global uses `aiplatform.googleapis.com`. [Official endpoint documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/locations). Independent review confirmed the correction; four offline adapter tests passed, covering EU OAuth, global/US key routing, express routing and validation.

## Local setup

Configure the ignored `.dev.vars` file. Do not use an AI Studio key for this Google Cloud endpoint. Standard key authorization requires a service-account-bound Google Cloud key with the necessary IAM permissions and API enabled; verify project model access. [Google Cloud key setup](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys).

```dotenv
VERTEX_AUTH_MODE=api_key
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=eu
VERTEX_MODEL=gemini-3.5-flash-lite
GOOGLE_CLOUD_API_KEY=your-local-secret
```

Alternatively use `VERTEX_AUTH_MODE=oauth` and a locally obtained short-lived `GOOGLE_CLOUD_ACCESS_TOKEN`. Express-mode users use `VERTEX_AUTH_MODE=express_key` with their express key and omit project/location. Key type cannot be inferred from its string. [Express endpoint differences](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/express-mode/api-reference).

The documented model supports `eu`, `us`, and `global`; `eu` is the proposed local test location, not a verified project setting. EU inference access was verified for this configured project in the pilot; that does not guarantee future quota. [Model documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite).

Run `npm run test:vertex-adapter` for offline adapter validation. With configured credentials and authorized paid usage, run `RUN_GEMINI_BENCHMARK=1 npm run test:gemini-luna`. Existing UI/API development servers must be running.

## Measurement and boundaries

Default pilot: twelve calls per provider, counterbalanced four-round fixture/order cycle, identical rendered synthetic planner JPEGs and production observation instruction. Two assignment states (Jonas and Lea) are repeated; this is not twenty diverse cases. Gemini uses minimal thinking/JSON output; Luna uses low reasoning/high image detail. Completion time includes body transfer and parsing. Report median/range of completed responses separately from quality pass counts; p95 is intentionally withheld below twenty completed samples per provider.

The runner uses a separate browser tab context and synthetic session; records hashes, safe synthetic questions and error categories, and deletes its session. It uses fixed Google/OpenAI destinations, denies redirects and never logs headers, credentials, provider error bodies or Google project IDs. It validates returned JSON locally and rejects basic known-person/safety failures. Those heuristics do not catch every hallucinated task/date, so manual output review is required before considering a switch. An empty question is flagged in these nonempty planner pilot fixtures; future unrelated-screen cases need an explicit no-question expectation.

No automatic switch occurs. Broader acceptance still needs diverse screenshots, exact task/date/name review, unrelated/ambiguous screens, followed by app capture-to-question and voice timing checks. Standard API-key/header endpoint compatibility is based on official authentication and resource definitions; OAuth EU access was tested; standard key and express account access remain untested.
