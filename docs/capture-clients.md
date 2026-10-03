# Optional desktop capture clients

The browser workspace remains the primary Capture → Map → Teach interface. These clients contribute evidence to the same session contract. They never intercept application saves or guarantee pre-save intervention in arbitrary software.

## Chrome MV3 extension

Load `apps/chrome-extension` as an unpacked extension using Chrome's developer extensions page. Open its side panel with the toolbar action. Open the development workspace at `http://localhost:5173`, start recording, explicitly reveal/copy its optional-client session capability, then enter the session ID and bearer token into the panel. The backend endpoint defaults to `http://localhost:8787`. Tokens are held in panel memory, never local storage, URLs or logs. Enter the exact target tab origin, select that tab, then press **Consent and capture current tab**.

The endpoint accepts only HTTP loopback origins (`localhost` or `127.0.0.1`). Set backend `EXTENSION_ORIGIN` to the installed extension's exact `chrome-extension://<extension-id>` origin. The backend must allow that exact origin through its CORS policy; broad remote endpoint access is deliberately absent. `activeTab` permission requires a user extension action. No installation or browser permission flow was exercised during code validation.

Capture sends clicked control names (at most 100 characters) and activity categories. It never reads input values or saves key characters, key codes, modifier combinations or clipboard. Labels and screenshots can still contain personal information. Optional visible-tab JPEG capture is separately consented and runs approximately every two seconds, only while the selected tab remains active in its window and on the allowed origin. This is not a browser history recorder or full-screen recorder.

The side panel stops local listeners/timers and aborts an in-flight evidence upload immediately on **Off record**, then requests a session-wide recording pause with the current epoch; the backend increments it atomically. Closing the panel stops local capture. It does not establish that the remote session has paused; use the workspace control if needed. Injected listeners remain inert on the page until navigation; they send nothing while disabled.

## macOS companion

Requires macOS 14 or newer and a Swift toolchain with ScreenCaptureKit. Build using `swift build --package-path apps/macos-companion`. The SwiftUI executable provides a window selector, local workspace configuration, memory-only bearer entry, consent control and off-record control. Run the built executable on a Mac with screen-recording permission. Window titles are displayed locally to support selection and are not uploaded.

`SCContentFilter(desktopIndependentWindow:)` scopes screenshots to the explicitly selected window. `SCScreenshotManager` produces a JPEG frame roughly every two seconds plus processing/network time. This source does not record microphone, clipboard, Accessibility trees, typed text or global key streams.

The optional mouse/shortcut monitor is deliberately **local to the focused companion app**. It captures generic activity categories only. It therefore does not establish activity or reading detection in the selected external application's window. Global input monitoring and Accessibility export are not implemented. Keyboard typing in another application remains invisible to this companion.

The companion uses ephemeral URL sessions and refuses redirects. Endpoint credentials are memory-only and only HTTP loopback endpoints are accepted. Package execution is not a signed/notarized `.app` distribution: packaging, signing, TCC attribution, actual screen permissions and hardware behavior need runtime verification.

## Shared session authority and limitations

Both clients consume `GET /api/sessions/:id`, `POST .../evidence`, and `POST .../recording` from `src/shared/contracts.ts`. The workspace owns creation and recording activation; clients cannot independently resume a paused session. Before uploads they verify recording and epoch. Session off-record increments epoch, and the server must reject mismatched epochs and paused evidence. Clients stop when authority changes; polling means a remote pause is observed asynchronously, not instantly on every device. Local privacy controls stop local modalities synchronously; already received server evidence is not deleted by pause.

There is no unbounded event queue. The extension drops events while one upload is pending, throttles activity and samples frames; native metadata has one pending operation at a time. Native screenshots and metadata can overlap, so backend epoch rejection remains necessary. Neither client uploads buffers after resumption; start requires fresh authority validation.

No bearer tokens belong in screen recordings, URLs, command lines, screenshots or Git. For a demo, use synthetic target data and avoid leaving credential-entry windows in the selected capture area.

## Verification baseline

- Chrome JavaScript syntax checked with `node --check`; manifest JSON parses. `node apps/chrome-extension/panel.test.mjs` passes mocked checks for current-epoch pause requests, immediate local stop, bearer-only transfer and loopback endpoint rejection. This is not an installed-browser test.
- Swift package build attempted with temporary compiler caches. Build succeeded with the installed toolchain; compiler caches and outputs were redirected to `/tmp`. This proves compilation, not permission or hardware behavior.
- Chrome loading, exact-origin CORS, runtime API exchange, native window capture, TCC permission prompts, multi-client pause races and hardware behavior require actual runtime tests.
- These clients supply metadata/frame evidence; ElevenAgents, Scribe, vision analysis and the browser session UI are integrated elsewhere. These source files alone do not prove challenge compliance.
