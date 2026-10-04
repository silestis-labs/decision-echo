# Luna / Sol observation comparison — 2026-10-04

## Decision

Use `gpt-6-luna`, `reasoning.effort: low`, image `detail: high` for short Capture/debrief screenshot questions. Keep `gpt-6.1-sol` for Work Map compilation and learner visual coaching. Deterministic planning validation is unchanged.

This is a configuration decision supported by a small local evaluation, not a universal claim that Luna matches Sol's accuracy. Low-detail Luna was explicitly rejected after a task-name hallucination.

## Method and results

Nine authorized real Responses requests used the exact production observation instruction and actual rendered fictional planner screenshots. The baseline presentation assignee was Jonas; the changed case assigned Lea while the visible restriction remained “Jonas only.” Screenshot SHA-256 hashes matched across all compared configurations. No Notion writes, real microphone input or OS capture occurred.

| Configuration | Requests | Grounding checks passed | Median latency | Range |
| --- | --- | --- | --- | --- |
| GPT-6.1 Sol / existing reasoning default / low image detail | 3 | 3 | 8,431 ms | 7,635–10,860 ms |
| GPT-6 Luna / low reasoning / low image detail | 3 | 2 | 3,224 ms across all calls | 2,060–6,349 ms |
| GPT-6 Luna / low reasoning / high image detail | 3 | 3 | 5,358 ms | 5,154–5,924 ms |

Selected Luna configuration reduced median provider latency by approximately **36.5%** versus the existing Sol configuration. This compares workload configurations, including reasoning and image detail, rather than isolating model architecture. No percentile, load, audio-onset or complete capture-to-speech benchmark is implied. Three requests per configuration and two screenshot states are a limited sample; provider variability and warm-up can affect results.

Both high-detail Luna changed-case questions were:

> Why is Finalize Client Presentation assigned to Lea when it says Jonas only?

The baseline question concerned the visibly unassigned Update Market Analysis task. Low-detail Luna once called this “AltaMarket Analysis,” which is not a visible task title. An initially permissive automated topic check missed that; independent exact-output review marked the sample as a quality failure, and stronger visible-label checks were added. The JSON report retains that failure rather than presenting all experiments as successful.

All nine requests returned HTTP 200. Responses were checked for strict output shape, a single question, visible-topic/person/label grounding and unsupported safety claims, with manual review of actual wording. Suggested rule-kind labels still vary and are not confirmed expert rules. Synthetic benchmark sessions were deleted.

Full safe evidence: [benchmark JSON](luna-sol-benchmark-2026-10-04.json). Reproduce with authorized provider usage and local keys using `RUN_MODEL_BENCHMARK=1 npm run test:model-latency`. The benchmark intentionally records/rejects a low-detail configuration; an overall experiment quality-failure status does not mean the separately selected high-detail configuration failed.

## Implementation

### Verification after activation

The actual local app endpoint reported `observationModel=gpt-6-luna`, `observationReasoning=low`, `observationImageDetail=high`, while compilation/coaching remained `gpt-6.1-sol`. The real live-planner regression passed against this configuration: screenshot observation **4,888 ms**, activity evidence **31 ms**, ElevenLabs grounded typed reply **968 ms**, zero browser runtime errors and verified synthetic-session deletion. The question was “Why is Finalize Client Presentation assigned to Lea when the task says Jonas only?” The optional `customer_only` suggestion was absent in this response; the visible discrepancy question was still correct.

TypeScript, **72 unit tests**, production build, API and browser regression passed. Independent review confirmed workload isolation and unchanged privacy/output checks. The live app test uses direct actual rendered screenshot submission and synthetic typed voice; native sharing/ASR remain outside this verification. See [safe live measurements](live-planner-measurements-2026-10-04.json).

### Active variables

- `OPENAI_MODEL=gpt-6.1-sol`: map compilation and visual coach.
- `OPENAI_OBSERVATION_MODEL=gpt-6-luna`: screenshot question workload only.
- `OPENAI_OBSERVATION_REASONING=low`.
- `OPENAI_OBSERVATION_IMAGE_DETAIL=high`.

Without observation overrides, observation uses `OPENAI_MODEL`, default reasoning and low image detail, preserving prior configuration behavior. Keys stay server-side. Output validation, screenshot untrusted-data instructions, `store:false`, privacy epochs and deterministic save checks remain in place. No automatic retry to another model or model-generated plan approval was added.

Official capability verification: [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna) supports image input, Responses and low reasoning effort; checked 2026-10-04. Account access was additionally verified by the successful live requests. Configuration is local; no deployment or push was performed.
