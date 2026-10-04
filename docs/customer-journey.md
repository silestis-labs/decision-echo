# Customer journey and product surfaces

Status: historical full-product journey proposal, 2026-10-04. The controlled web sandbox is now implemented and live-provider tested; see [current runtime evidence](reviews/live-web-validation-2026-10-04.md). Team accounts, generalized adapters and some surfaces below remain proposals. The user confirmed Eleven v4 Turbo as the voice-model choice. Browser-first access and the optional installation model below are recommendations to settle before implementation, not previously confirmed user decisions.

## Assignment fit

The challenge prescribes a web screen-sharing Capture experience and allows flexible presentation such as a side panel, floating companion, timeline or overlay. An extension is not an explicit requirement. Our web workspace provides the complete Capture → Map → Teach journey; extension/native clients enhance it. A Mac-only product would leave the prescribed web path unproven. Detailed source interpretation is in the private requirements matrix; the [public acceptance contract](requirements.md) records the relevant gates.

## Product positioning

A team workspace where experts teach once through real work and voice, review the resulting skill, and let colleagues practice with a live tutor. A customer opens a URL to start. Installation is offered only when a selected workflow benefits from additional capabilities.

**Web workspace is the product's primary entry point.** Chrome extension and Mac companion are alternative enhanced session clients backed by the same workspace, skill library and services. A learner does not need the same client or OS as the expert. Transfers require a compatible application binding and confirmed semantic rules; raw coordinates are not portable skills.

## Platform and capability contract

| Surface | Intended access | Capture/teach capability | Boundaries |
|---|---|---|---|
| Web workspace | Desktop Chrome on macOS, Windows and Linux as initial support targets | Selected tab/window/screen plus microphone; voice, evidence timeline, reviewed maps, practice, library and controlled adapter writes | OS/browser permissions apply. No global keyboard/click/DOM access merely from sharing another surface. Cross-platform compatibility must be tested before advertised as supported. |
| Chrome extension | Optional installation for supported browser workflows | Tutor side panel beside the app, permitted DOM context, scoped interaction/activity metadata and contextual controls | Only authorized supported sites/frames; no native desktop activity visibility. Do not claim access to every iframe, restricted page, shortcut or application save. |
| Mac companion | Optional macOS application | Native scoped screen/input/accessibility signals, selected desktop-app workflows and a floating session controller | Requires relevant OS permissions; Mac-only enrichment. Web features remain independently usable. Windows/Linux native agents are future ports, not current claims. |
| Mobile/tablet | Future validated viewing/review access | Potential skill library and evidence review | Not a launch promise for expert screen capture, system input observation or full teaching. |

Chrome supports user-selected tab/window/screen capture; a web capture session may therefore observe a desktop window on a supported OS without our companion. Microphone access is separate; do not rely on system audio capture. Sharing pixels does not expose native input events or app structure. Sources checked 2026-10-04: [Chrome screen sharing](https://developer.chrome.com/docs/web-platform/screen-sharing-controls), [screen capture permission rules](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia).

A normal web app can place its own controls in its window; an integrated Chrome side panel or injected site overlay needs the appropriate extension/client path. Content scripts provide permitted page context; they do not turn screen sharing into cross-application control. Sources: [Chrome side panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel), [content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).

## Journey 1: Team owner creates the workspace

1. Open Decision Echo, create a team workspace and invite real colleagues as expert, learner or administrator.
2. Connect a permitted Notion workspace/page set for planning. A connection is necessary for adapter reads/writes, not for generic screen-only observation.
3. Create a skill such as “Plan the project week.” Describe the task, choose synthetic/demo or customer-approved data, and select sharing/access scope.
4. Choose a session mode: browser screen sharing, extension-enhanced browser workflow or Mac-enhanced desktop workflow. Show what the selected mode can observe and what permissions it needs.

The product should start with a task and its capabilities, not an infrastructure/provider setup screen. Team administrators configure providers; ordinary experts and learners use the workspace.

## Journey 2: Expert teaches through actual work

1. Click **Teach a skill**. Grant microphone and screen-share permissions; choose the task surface. Keep the voice panel next to the working window. On a single display, use a practical split layout; extension/native panels offer alternative layouts.
2. Complete the real planning task. The apprentice watches selected screen frames and asks about reasons and guardrails at useful pauses. Capture at least three qualifying live questions, including a guardrail question.
3. Use visible **Hold questions**, **Off record**, **Change shared surface** and **End task** controls. Hold questions leaves allowed recording active; Off record stops acquisition/uploads and invalidates queued work. Resume with explicit user action, requesting sharing permission again when needed.
4. Complete the spoken debrief: at least three genuinely new questions, then a teach-back the expert corrects and confirms.
5. Review the clickable Work Map: steps, branches, guardrails, screen evidence and expert wording. Unanswered items remain visibly unresolved.
6. Publish a confirmed skill version to the team library. Recording completion alone never publishes an authoritative skill.

Typing/speech/reading occupied states matter in every mode. Our own inputs can emit activity signals; a web-only session sharing an external Notion tab cannot read its keyboard events. Use honest visual/activity inference, conservative timing and an explicit reading/hold control. Extension/native modes add scoped signals; never assume silence means the expert finished reading.

## Journey 3: Learner practices on a new case

1. Follow an invitation or select a confirmed skill in the library. Click **Practice with tutor**.
2. Open a different project/case and share the learner's own screen. The tutor loads a specific confirmed skill version and its relevant evidence.
3. Tutor asks the learner to predict decisions, then explains when useful. The learner does the work; replay is targeted evidence rather than the entire training experience.
4. For the first Notion workflow, prepare schedule changes in Decision Echo's **proposed plan** panel, using current Notion task data. This is a real unsaved proposal, not a Notion edit already autosaved.
5. If the learner proposes moving a protected commitment, warn before the write, explain the expert's reason, and let the learner correct or escalate.
6. Validate the corrected proposal, show the change, commit through the Notion adapter and read back the result. A **not applied / partially applied / verified** distinction handles write failures honestly.
7. End with observed strengths and what needs practice. Assisted correction and independent success are separate outcomes.

The key moment is the expert's previously unstated reasoning preventing a new learner's mistake. This must result from captured and confirmed knowledge, not a hardcoded scenario rule.

## Journey 4: Reuse and maintain the knowledge

Search the library, reuse skills across supported clients, revise rules with experts, compare versions and practice additional cases. Full-suite extension lanes include two-expert comparison, multilingual teaching, agent-instruction export and additional application adapters. A change in the underlying application can invalidate a binding without invalidating the semantic policy; show that state and request review.

## Modes of assistance

- **Observe:** see a user-approved surface; collect evidence and clarify reasons.
- **Coach:** explain/predict/intervene using confirmed rules, with capabilities appropriate to the client.
- **Apply:** execute an authorized prepared change through a supported adapter, then verify it.

Extension and native sensors enrich observation and coaching. Neither establishes universal before-save interception. The enforced Notion path uses controlled proposals. Direct Notion edits can still be coached, but are outside that technical write guarantee. A future computer-use adapter needs its own execution and verification boundary.

## Product and engineering review inputs

Use this journey as the proposed baseline: one primary web platform, optional Chrome extension and optional Mac enhancement; no compulsory download for the connected Notion journey. Preserve full-suite scope and design shared contracts across all clients. Confirm browser/OS targets through a support matrix rather than advertising untested compatibility.

Voice selection is **Eleven v4 Turbo**, explicitly chosen by the user. The earlier provider documentation referred to **v3 Conversational**, not “v4 Conversational.” v4 Turbo is documented for ElevenAgents. Keep the challenge's named Expressive Mode/Scribe behavior in acceptance checks and validate the chosen configuration; model selection does not itself prove that behavior. Source: [Eleven v4 Turbo](https://elevenlabs.io/v4).

Before finalizing the engineering plan, specify permission/error/reading states, supported Notion schema, proposed-plan interaction, evidence version contract, activity capabilities per client, authenticated client/backend transport and off-record propagation. The support targets and journey above require acceptance evidence after implementation. No app, extension or companion is currently available.

See [platform architecture](platform-architecture.md), [implementation plan](implementation-plan.md) and [requirements](requirements.md).
