# Hosted web release verification — 2026-10-04

The supervised weekly-planning demo is deployed and verified with Gemini observation, OpenAI Work Map compilation and ElevenLabs interviewer/tutor integration. This report covers the controlled web demo, not a general production team service. Source reviewed:9edf1be; subsequent documentation changes do not alter this runtime.

## Checks that passed

- Final screenshot review corrected the fullscreen session rail’s primary button contrast with a scoped CSS rule; independent cascade review and the full isolated browser regression passed again.
- TypeScript,120unit tests across20files, production build and GitHubCI. Independent source review fixed an IBAN text-recognition suffix defect and checked its synthetic regressions.
- Isolated API and browser Capture/Map/Teach tests, reload recovery, evidence links,390px layout, explicit save authority, privacy epochs/lease, skill export and deletion. Chrome extension runtime tests passed within their documented coverage.
- Actual rendered planner edit Jonas→Lea produced activity evidence in35ms; Gemini recognized the changed visible assignee in803ms. A neutral typed probe received a grounded ElevenLabs reply in986ms. This synthetic test used a muted fake microphone, not speech recognition. Earlier25second transport timeouts remain in [planner measurements](live-planner-measurements-2026-10-04.json).
- A separate real human microphone check in hostedChrome produced actual speech transcription. The draft retained its original question/answer while subsequent turns stayed in the transcript for explicit review. It did not establish a complete human-confirmed WorkMap. Off-record stopped screen and microphone.
- The complete disposable hosted API workflow passed: real Gemini analysis of fictional planner pixels; six explicitly synthetic answers; realOpenAI compilation of six evidence-backed rules; map confirmation; tutor authorization; learned Atlas overlap rejection; invalid commit422; whole-block correction; explicit sandbox save; credential-free skill export; off-record409; session deletion. Compilation took15152ms; observation762ms. SignedURL checks are distinct from WebSocket/audio checks.
- The subsequent equivalent credential deployment passed a fresh hosted observation in832ms, access gating, expert voice authorization, tutor pre-confirmation rejection and off-record cleanup. Current deployment:9627de38-c168-4e95-ab5e-c525e885b6e1.

## Conversation correction

The remote expert prompt was updated to ask at most one question per turn, keep the guardrail separate, avoid repeated idle nudges and omit emotion markup. Its V4Turbo TTS setting was preserved. One subsequent fresh synthetic exchange correctly identified the edited task and assignee, asked one question and used no emotion markup. This is supporting evidence, not a guarantee about every spoken turn.

## Practical boundaries

- Use fictional data and supervise the demo. Shared access code is a demo gate, not user/team identity.
- Model output is advisory; deterministic supported operators enforce the controlled planner's save boundary. Screenshots do not prevent external application autosave.
- Frames are sampled every2seconds; inference is serial and rate-limited, so every sample does not trigger an immediate request. Provider latency varies and timeouts are reported without automatic delivery retry.
- Complete human six-answer rehearsal, nativeMac permissions/hardware capture, positive toolbar-granted extension screenshots, generalized roles, cross-device library, team accounts and load validation remain separate work.
- Text recognition does not redact screenshot pixels or provider voice. The large client bundle warning remains. No realNotion write was tested or required for this demo.

See [demo walkthrough](../demo-walkthrough.md), [capture clients](../capture-clients.md) and the historical reports for earlier test conditions.
