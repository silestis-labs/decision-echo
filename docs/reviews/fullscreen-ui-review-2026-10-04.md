# Full-view session UX review — 2026-10-04

## Scope and changes

Source baseline: `5592f1c`; inspected the uncommitted changes in `src/ui/main.tsx`, `src/ui/session-controls.tsx`, `src/ui/session-controls.css` and `src/ui/notion-planner.tsx/css`, with integration coverage in `tests/browser.integration.mjs` and `tests/voice.integration.mjs`.

Reviewed the existing full-view planner in the user's real Chrome window at localhost. Previously its floating controls exposed status and Off the record only, while capture, voice, question review and saving remained outside the full-view surface. This change builds on the existing planner and structured edit events.

- One Start session action requests screen selection directly from the click, then connects the configured ElevenLabs role after capture succeeds. Cancelled or stale permission responses cannot activate capture after Off the record.
- Screen and voice states remain separate and truthful. Voice connection failures can be retried without restarting an active screen stream.
- Full-view Capture provides an expandable answer review, original-frame linkage, explicit rule/guardrail selection, evidenced answer saving and transition to debrief.
- Full-view Teach provides the tutor question, current validation findings, a fresh check and explicit approved save. Proposal edits still invalidate validation; the server rechecks before commit.
- Recording settings and labeled synthetic test controls are collapsed in the regular workspace. Demo data remains disclosed, without repeated development copy in the main flow.
- A desktop session rail reserves space beside the planner. Narrow views reserve a separate lower control area; task details retain an accessible stop action.
- Expanded mode makes background branches inert, bounds keyboard focus, supports Escape and restores focus. Independent review identified this issue before correction.

## Verification

- TypeScript, 70 unit tests across 18 files and production build passed. The existing approximately 974 kB JavaScript bundle warning remains; this is not a performance benchmark.
- Isolated browser regression passed for capture/debrief, confirmation, learner conflict/correction, save/export, recovery and privacy. Additional full-view coverage checks keyboard containment, Escape/focus restoration, a visible enabled stop with mobile task details, delayed screen-selection cancellation an evidenced answer saved inside full view, and learner validation/approved save directly in full view. Responsive checks cover 390, 800 and 1440 pixel widths.
- Real ElevenLabs expert and tutor integration passed using the combined Start session action, labeled synthetic typed narration and fake screen/microphone fixtures. The tutor explained the required assignee, the invalid plan stayed blocked, correction saved and the reviewed skill downloaded.
- Real Chrome inspection verified full-view session controls, opening/closing answer review and calendar/table navigation. The final screenshot is a local review artifact at `/private/tmp/decision-echo-fullscreen-chrome.png`; it is not committed as user recording data.

## Limits

This is local UI and integration verification, not proof of deployed production readiness. This pass did not verify human microphone transcription, a fresh OS capture permission flow, Cloudflare deployment, real Notion writes or native Mac permissions. Real provider calls in the synthetic integration do not establish human expert learning. The existing domain and publication boundaries remain in force.

## Docked sidebar refinement

User feedback replaced the remaining floating card with a full-height, flush right sidebar. The session actions occupy a fixed header; the answer/plan content scrolls independently underneath. Rounded card borders, shadow and outer gaps are removed. Small viewports use a flush bottom dock. Consolidated the earlier floating-control CSS rather than retaining conflicting overrides.

Verified in actual Chrome and with the isolated browser workflow: the desktop session region begins at viewport y=0, reaches its bottom and right edge, and preserves full-view answer saving, learner check/approved save, emergency stop and responsive navigation. Production build and TypeScript passed. Local screenshot: `/private/tmp/decision-echo-session-sidebar-chrome.png`. No provider call or deployment was needed for this layout refinement.

The user subsequently requested removing the left planning navigation while the session dock is shown. Full view now hides that navigation at every width; the regular embedded workspace keeps it. Actual Chrome confirms the wider planning area and retained Exit full view action. The desktop browser assertion explicitly checks that the left sidebar is hidden.
