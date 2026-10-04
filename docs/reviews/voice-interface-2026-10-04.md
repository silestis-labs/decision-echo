# Voice interface review — 2026-10-04

## Implemented

Added an original lightweight orb and level meter, inspired by [ElevenLabs UI](https://elevenlabs.io/blog/elevenlabs-ui). This is not a vendored ElevenLabs UI component. The official [component library](https://github.com/elevenlabs/ui) uses shadcn; its Orb uses a WebGL/Three.js stack. Our implementation adds no dependencies and preserves the existing authenticated conversation and emergency-stop controls.

The workspace and full-view dock display connecting, listening, agent speaking, paused and explicitly muted synthetic-reply states. Levels come from the existing ElevenLabs React SDK's `getInputVolume` and `getOutputVolume`, sampled at most ten times per second. No microphone, conversation or provider request is opened by the visualization. Decorative elements are hidden from assistive technologies; the textual state is announced separately. Reduced motion disables orb scaling and transition effects.

Independent review found a shutdown race: server recording state could remain true while local shutdown was underway. The meter now checks authoritative local recording/off-record refs before every SDK getter. Server shutdown latency cannot extend sampling authorization.

## Verification scope

Typecheck and 72 unit tests passed. Production build passed with the pre-existing large-bundle warning. The isolated voice-UI browser test uses deterministic SDK getter fixtures to verify input/output levels, muted input, immediate local shutdown even with a connected SDK, and reduced motion. These are UI/lifecycle tests, not evidence of human microphone recognition or a new live provider call.

The existing browser workflow regression checks the integrated session dock at desktop and mobile widths, capture/debrief, map confirmation, learner validation/correction/save, session recovery and privacy. Screenshot: `/private/tmp/decision-echo-voice-ui.png` (synthetic workspace, paused voice).

## Jev assessment

If the intended Jev is TypeSafe AI, its [current introduction](https://docs.typesafe.ai/introduction) describes typed decisions rather than free-form generation. Its [state documentation](https://docs.typesafe.ai/concepts/state) explicitly accepts text/JSON, with no image/audio/video input. It could be evaluated as a separate question-timing gate (`WAIT`, `ASK_WHY`, `ASK_GUARDRAIL`, `DEFER`) using transcript and structured planner events. It does not replace the voice interface, ElevenLabs audio or screenshot vision. No Jev integration, account access, speed measurement or provider switch was performed.

The UI change does not fix multi-question agent turns or shorten model inference. A Jev experiment should compare grounded timing quality and end-to-end latency against the current deterministic pause gate before adoption.
