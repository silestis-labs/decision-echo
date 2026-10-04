# Before-share authorization gate

The user explicitly requested live release of the dialog on October 4, 2026, superseding the earlier publication hold. The notice was previously corrected under user authorization to name Google Vertex, existing sessionStorage, limited text redaction, unmasked screenshots and actual session deletion/retention. This release does not claim legal certification or independent owner/legal review.

The approved declaration precedes screen, microphone and web companion activation. The checkbox starts unchecked. Cancel/Escape discard the pending action; no pending acquisition, content upload or provider operation starts while the dialog is open. Pause and denied screen access require a fresh declaration. Typed content/model operations have a separate memory-only per-session acknowledgement. Existing sessionStorage is retained; no new browser storage was added.

The footer and dialog link to /privacy in a new tab, preserving the session. docs/privacy.md is the source of truth. Native Mac and extension permission interfaces are unchanged. No Presidio, OCR or screenshot pixel masking is added or claimed.

Integration preserves the already deployed public jury-session access setting and Vertex API-key authentication. Browser permission testing uses synthetic media and does not prove hardware permissions.

## Release verification

- `npm run check`: PASS, 134 tests / 23 files, TypeScript and build. Existing bundle-size warning remains.
- `npm run test:browser`: PASS, full synthetic Capture/Map/Teach regression including declaration, cancellation, route/footer and saved plan. Intermediate integration runs failed while the planner rename/save wording was being merged; final stable run passed after resolving those conflicts.
- `npm run test:api`: PASS, isolated Durable Object authority and controlled-save regression.
- `npm run test:extension`: PASS, existing panel/privacy tests.
- `npm run deploy`: PASS, hosted version `f9b40874-e3d6-44ba-98ba-c219d3d198ee`.
- Hosted Chromium smoke: unchecked declaration, disabled Continue before acknowledgement, enabled after checking, Cancel with zero media calls and zero capture/content/provider requests, accessible footer and rendered /privacy with Google Vertex section all passed. Disposable hosted session deletion returned200. Gemini configuration remains enabled; public jury access is preserved. No paid inference or actual microphone/OS picker was invoked in this smoke test.

Release is deployed from the integration branch; PR #6 is open, main remains unmerged by this release.
