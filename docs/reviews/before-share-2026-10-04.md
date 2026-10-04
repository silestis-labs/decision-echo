# Before-share authorization gate

Implementation on the privacy feature branch; not merged or deployed. The acknowledgement is an authorization declaration, not proof of internal approval or GDPR consent.

The exact approved wording appears before screen sharing, microphone activation and companion activation. The checkbox begins unchecked; Cancel/Escape do not start the pending action. The memory-only gate preserves the browser user gesture. Pause and denied screen permission require a new unchecked declaration before restarting capture. Separate per-session acknowledgement guards typed content submission, Work Map compilation/edits and controlled plan validation/commit, including restored sessions. Session switching, new sessions and forgetting access clear that acknowledgement.

Privacy Notice opens /privacy in a new tab without unloading the session. docs/privacy.md is the rendering source of truth and is byte-for-byte identical to the supplied notice. A footer remains reachable in normal and fullscreen views. No new browser storage is introduced; existing sessionStorage is preserved by explicit user decision.

The supplied legal text is not a verified description of current implementation. It omits Google Vertex/Gemini and describes unimplemented Presidio image masking, selective screenshot deletion and 30-day retention cleanup. It also overstates transcript masking and paused processing, and does not distinguish the local sandbox planner from external Notion. Full findings are recorded in the PR. Do not deploy this page before Annelie approves corrected wording. No legal text was silently corrected.

Unit and browser checks cover acknowledgement controls, cancellation/pending no-acquisition, route/notice rendering, footer accessibility and existing Capture/Map/Teach behavior. Synthetic browser media does not establish actual OS picker or microphone permission behavior. Native/extension permission UX is outside this change; their existing flows remain intact.
