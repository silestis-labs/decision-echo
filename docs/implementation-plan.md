# Decision Echo implementation plan

Status: proposed execution plan, not implemented functionality or an approved final stack. The full suite remains the target: capture, expert interview, reviewed Work Map, learner coaching, controlled execution and skill library. Build orchestration uses the current coding-agent environment; application orchestration is a separate architecture choice.

## Proposed foundations

- Native macOS capture/input/accessibility contract and companion. Compare the existing Swift sensor proposal with OpenAdapt Capture’s Python/native implementation before choosing the sensor engine.
- React/TypeScript web workspace with real browser screen sharing.
- TypeScript application service with versioned event/evidence, Work Map and adapter contracts.
- ElevenLabs Agents SDK for voice session integration.
- Explicit lifecycle state machines; XState is a candidate for TypeScript-owned states.
- rrweb only for instrumented interfaces we control; screenshot evidence remains available for external apps.
- Playwright for browser integration tests and supported browser adapters.

Native recorder references and additional execution frameworks need license and source review before reuse. OpenAdapt Capture is an additional sensor candidate; OpenAdapt Flow and browser-use are separate execution candidates, not replacements for expert interviewing/teaching. No packages are installed by this plan. No unverified private API is a required build dependency.

## Review outputs before implementation

An engineering review should resolve process boundaries, schemas, provider interfaces, privacy epochs, failure recovery, controlled commit behavior and independent worker lanes. A design review should specify capture consent/status, question timing controls, Work Map review, learner intervention and failure states. A targeted capture/privacy review should resolve outbound data scope and untrusted-screen/tool boundaries. Record decisions in a reviewed revision of this plan.

Full gstack skill workflows are optional tooling for these reviews and have not been claimed completed by writing this document. Do not reopen the confirmed full-product scope merely to fit a small-demo template.

## Dependency-aware tasks

| Task | Output | Dependencies / ownership |
|---|---|---|
| T0: contracts and fixtures | Event envelope, evidence references, map/rule versions, adapter capabilities, synthetic session fixture | Coordinator owns shared contracts and manifests |
| T1: native platform | Scoped frame/input/AX evidence, permission state, pause epochs and durable local capture | T0; one native-platform worker |
| T2: voice and observation | ElevenAgents sessions, screen summaries, gap ledger and turn/question coordination | T0; one voice/vision worker |
| T3: knowledge service | Evidence storage, map compilation, uncertainty/revisions and confirmed-version publishing | T0; one knowledge worker |
| T4: product surfaces | Desktop/web session controls, evidence timeline, expert review and learner workspace | Reviewed T1–T3 interfaces; UI worker |
| T5: application adapters | Notion/planning state, prepared changes, validation, commit and read-back verification | T0 and published map contract; adapter worker |
| T6: integrated teaching | New-case guidance, grounded intervention and demonstrated-progress assessment | T2–T5; coordinator integrates |
| T7: independent evaluation | Permission/pause/error checks, unseen cases, changed-rule test, before-commit verification | Running T6 journey; independent QA/privacy roles |
| T8: extension and release | Second binding, versioned export, multilingual teaching, packaging and reproducible demo | Stable contracts; prioritize completed integrations and actual evaluation findings |

Logical roles run within available runtime limits. Workers receive exclusive paths and acceptance checks; shared contracts, lockfiles and entry points remain coordinator-owned unless explicitly delegated. A product worktree does not automatically contain private context. Work on separate branches where appropriate and integrate reviewed outputs before starting dependent tasks.

## First complete journey

Use synthetic planning data. An expert demonstrates a workflow containing a meaningful exception, answers live screen-grounded questions, completes a distinct debrief and confirms a playable Work Map. A learner receives a different case. The tutor identifies a wrong decision before a controlled adapter commit, explains it using confirmed expert evidence, guides correction and verifies the result.

Observe arbitrary apps where capabilities permit; promise technical pre-commit enforcement only on controlled write paths. Off-record must stop every modality and reject stale outbound work. Evaluate the learned policy with changed expert input rather than hard-coding one demo answer.

## Build admission and handoff

Verify the native toolchain, provider account/configuration and synthetic app schema before claiming a runnable integration. Discover actual SDK versions and pin chosen dependencies after source review. Document real setup/check commands with implementation; none are invented here.

Each task reports paths, decisions, actual checks, skipped verification, blockers and next dependencies. Preserve public-safe product history and separate private knowledge history. A successful component check is not completion of the end-to-end product.

References: [ElevenLabs SDK](https://github.com/elevenlabs/packages), [XState](https://github.com/statelyai/xstate), [rrweb](https://github.com/rrweb-io/rrweb), [Playwright](https://github.com/microsoft/playwright), [gstack](https://github.com/garrytan/gstack), [developer workflow](../CONTRIBUTING.md).
