# Decision Echo closing slide

Use [the standalone Moonshot slide](moonshot.html) as the **last slide of the demo or product pitch**, immediately after the learner corrects the new case. This connects the demonstrated expert-to-learner transfer to the larger ambition. Open the HTML in a browser at a 16:9 viewport and present fullscreen. It uses system fonts and has no external dependencies; narrow screens display a stacked reading view.

The technical presentation should briefly explain the bridge that makes this roadmap plausible: evidence references, expert-confirmed map versions, deterministic checks on controlled write paths, and explicit human approval. The full Moonshot belongs at the end of the product story; include it at the end of a combined demo-and-tech presentation as well.

## Spoken close (approximately 20 seconds)

> Today, Decision Echo transfers one expert's judgment into a reviewed Work Map and teaches a learner through a new case. Next, teams share and revalidate that knowledge as work changes. Our moonshot is a living company memory: humans learn, and controlled agents follow the same reviewed guardrails, with human escalation.

## Implementation and vision

| Horizon | What the slide means | Status and boundary |
| --- | --- | --- |
| Today | Expert capture and clarification, an evidence-linked Work Map, explicit expert confirmation, and coaching on a different planning case. | Implemented. Controlled planner checks and approval gate the application's save path. The [release verification](../reviews/release-verification-2026-10-04.md) records actual runtime checks and their limits; a complete observed human learning trial remains distinct from synthetic verification. |
| Next | Team identity and authorized sharing, historical revision browsing, focused expert revalidation after relevant changes. | Proposed work. Current session access and confirmed map versions do not constitute a team account system or a historical revision library. |
| Moonshot | The same reviewed judgment supports human learning and controlled agent actions; uncertain or conflicting cases escalate to a human. | Future product vision. Agent execution and organization-wide knowledge governance are not demonstrated capabilities. |

The roadmap concerns reviewed knowledge transfer. It does not imply training a model from a recording, universal replay, or interception of every application's save operation.

For the concrete present-day sequence, use the [demo walkthrough](../demo-walkthrough.md). For the system boundaries, see [platform architecture](../platform-architecture.md) and [requirements](../requirements.md).
