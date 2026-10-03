# Decision Echo requirements and acceptance contract

Status: source-derived specification and proposed acceptance checks, 2026-10-03. Application behavior is not implemented or verified. Target: complete challenge coverage and persuasive evidence; this is not a guarantee of a judge score. The supplied ElevenLabs brief has no numerical scoring weights.

This public-safe specification paraphrases the challenge and defines our product acceptance contract. Original materials and page-by-page provenance remain in the separate private knowledge repository. “Required” denotes explicit challenge requirements; “expected” denotes behavior/technology described by the brief; “quality” denotes judging signals; “extension” denotes our full-suite product ambitions.

## Required challenge gates

| ID | Requirement | Observable acceptance evidence |
|---|---|---|
| CORE-01 | Deliver Capture, Map and Teach as one connected journey. | An expert session produces a confirmed map that the learner subsequently uses. No manually substituted map between stages. |
| CAP-01 | Provide a web capture application with expert screen sharing and an ElevenLabs conversation panel. | Expert selects the shared surface; the browser session supplies real observations and voice. A native companion may enrich this path. |
| CAP-02 | Ask at least three live questions at natural pauses, each about a visible screen moment. | Three timestamped question/answer records link to observed evidence and the choice that prompted the question. Generic questions do not count. |
| CAP-03 | Include at least one live guardrail question. | Expert explains a limit, exception or stop/escalation condition during Capture. |
| MAP-01 | Conduct a spoken debrief with at least three follow-up questions that were not already answered during the task. | Gap ledger identifies three distinct unresolved issues and records new answers. Repeating live questions does not satisfy this gate. |
| MAP-02 | End with teach-back confirmed or corrected by the expert. | The expert hears the synthesized understanding, corrects errors if needed, and explicitly confirms the resulting map version. |
| MAP-03 | Provide a clickable Work Map timeline with evidence for every step and guardrail. | Each item resolves to a screen moment and the expert's own words; display the action, decision, reason and applicable guardrails together. |
| TEACH-01 | Guide a new hire on their own screen through a case the expert never demonstrated. | Use an unseen fixture rather than replaying the expert's case. The judge can operate the learner interface. |
| TEACH-02 | Catch at least one wrong decision before it is saved and explain it using expert reasoning. | The warning precedes the application write. Show the expert quote and evidence supporting it, allow correction, and verify the corrected persisted result. |
| PITCH-01 | End the pitch with one moonshot slide and a path from the working build. | The slide connects today's demonstrated capabilities to an extensible product vision without presenting planned features as working. |

## Expected module behavior and technology

These complete the prescribed experience beyond the minimum-count boxes. Their implementation choices should be rechecked against current provider documentation when building.

| ID | Expectation | Acceptance check |
|---|---|---|
| OBS-01 | Observe shared frames approximately every 1–2 seconds and turn changes into meaningful events. | A trace links selected frames, detected state changes and conversation context. Avoid storing redundant images as the only representation of work. |
| VOICE-01 | Use ElevenAgents for both expert interviewer and learner tutor. | Both roles run actual ElevenLabs sessions; show session configuration and working tool/context integration. |
| VOICE-02 | Use the listed Expressive Mode and Scribe v2 Realtime capabilities. | Verify account availability and exact configuration; demonstrate patient speech and live listening. Record any provider limitation rather than relabeling a different service. |
| TURN-01 | Stay quiet while the expert types, reads or speaks; ask at useful pauses. | Demonstrate all three conditions, including explicit reading/hold control where needed. No-input duration alone is insufficient proof of reading completion. |
| MAP-04 | Resolve uncertainty, exceptions and unseen situations during the debrief. | Open gaps become answers or remain explicitly unresolved; the compiler does not invent rules. Confirmed and uncertain rules have distinguishable status. |
| TEACH-03 | Ask the learner to predict the next decision, explain the expert's approach, and replay expert evidence when useful. | Learner makes a choice before receiving the answer; tutor explanation and evidence align with the confirmed map. |
| TEACH-04 | End with a mastered/needs-practice summary. | Summary cites observed learner decisions and remaining weaknesses, rather than treating session completion as mastery. |
| TRUST-01 | Support off-record operation and protect personal data on screen. | Visible pause state, demonstrable exclusion of sensitive content and explicit handling of what providers receive. Our stricter implementation checks are below. |

## The five Apprentice Test questions

| Judge's question | What we demonstrate |
|---|---|
| When does it ask? | Screen-linked questions at natural pauses, with typing, reading and speaking quiet periods. |
| What does it ask? | Reasons, exceptions and guardrails that screen observation alone cannot reveal. |
| When has it understood? | A gap-closing debrief and expert confirmation of a specific map version. |
| Did the learner learn? | Independent prediction and correct handling of an unseen case, including a recovered mistake. |
| Can the expert trust it? | Off-record controls, protected screen data and an auditable evidence trail. |

Technical depth, communication and innovation/creativity are additional event-wide judging signals. Demonstrate engineering quality and original expert-to-learner transfer; clear documentation and videos make those capabilities assessable. They do not supply numerical ElevenLabs weights.

## Proposed first workflow: Notion planning

The user selected Notion and planning; the following exact scenario and rules are synthetic proposals, not supplied expert knowledge.

An expert plans a project week, working backward from dependencies. An externally promised review is protected. If a new request cannot fit without moving that commitment, the planner negotiates scope or escalates rather than silently rescheduling it. Record the actual expert's reasoning and exceptions during the session; the tutor must use that confirmed knowledge.

The learner receives a different project and a new urgent request. They propose moving the protected review. Hold the proposed changes in our unsaved planning panel. The tutor explains the conflict with the expert's evidence, asks for an alternative, then permits a compliant change through the Notion adapter. Show the resulting Notion state after the write.

**Critical acceptance boundary:** Notion commonly autosaves edits. A warning after an already persisted edit does not establish TEACH-02. The guarantee applies to changes prepared and committed through our controlled adapter. Direct edits in an external application can be observed and coached; universal interception is not claimed.

## Product engineering acceptance checks

These are our implementation requirements, not extra official scoring criteria.

- **E-01 Evidence integrity:** events, screenshots, transcript spans, questions, answers and map items have stable references and timestamps; missing evidence blocks publication of a confirmed rule.
- **E-02 Real learning:** changing an expert-confirmed rule changes the tutor's decision on the same fixture. A compliant unseen case succeeds. This detects a hardcoded demo.
- **E-03 Commit ordering:** the event trace establishes violation proposal → warning → correction → validated write → read-back. No invalid write occurs through the controlled adapter.
- **E-04 Privacy:** off-record stops capture/upload modalities and invalidates buffered or queued work. A synthetic privacy canary does not appear in recordings, maps, logs or outbound requests from the paused interval.
- **E-05 Recovery:** permission refusal, interrupted voice, missing frames, provider failure and stale application state produce visible recoverable states. A failed write cannot be reported as success.
- **E-06 Extensibility:** platform sensing, provider integration, Work Map knowledge and application adapters have separate contracts. Additional applications can consume the same evidence/rule structure.
- **E-07 Reproducibility:** synthetic demo fixtures, environment template, setup instructions and explicit verified/untested status allow another developer to reproduce the journey.

## Full-suite and stretch coverage

Keep the full product ambition while sequencing dependent work. Native macOS screen/input/accessibility sensing, skill library/versioning, adapters and controlled execution extend the shared web experience. These are product choices; a particular desktop shell or framework is not dictated by the challenge.

The brief's stretch opportunities are: compare two experts and clarify disagreements; teach in another language; export the Work Map as agent instructions preserving steps and stop conditions. Track each as separately demonstrated or planned. Export is not evidence of universal executable replay, and a multilingual pitch is not proof of multilingual tutoring.

## Submission readiness

Event slides list a public code/docs repository, live demo, demo video, technical video, team video, platform submission and a backup form. Account/team registration and challenge communication are organizer checks. Confirm the current submission UI, video constraints and backup-form URL before filing; those details are not fully specified by the supplied materials. Do not publish private research or original materials with the product.

## Coverage reporting

Use `not built`, `implemented but unverified`, `verified` or `blocked` per requirement, with an evidence link and map/build version. A connected local sandbox journey is implemented and tested; live voice/vision and Notion gate verification remain pending. See [implementation results](reviews/implementation-results.md) for evidence and limits. Documentation completion is not functionality completion. “100% required-gate coverage” means every explicit gate has verified evidence; report expected behaviors, quality signals and stretch coverage separately. No calculated percentage should be presented as an official score.

See [implementation plan](implementation-plan.md), [agent bootstrap](agent-bootstrap.md) and [publication policy](publication-policy.md).
