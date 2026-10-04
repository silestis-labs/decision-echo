# macOS companion

The macOS 14+ companion captures one explicitly selected window and sends evidence to the same workspace session used by the web app. It is an optional capture client; Capture, Work Map, Teach and the skill library remain in the web interface.

## Build and open

Install the Xcode command-line tools, then run:

```sh
cd apps/macos-companion
swift test
bash scripts/build-app.sh
open "build/Decision Echo Capture.app"
```

The script creates an app bundle with a stable bundle identifier and an ad-hoc signature. The generated `build/` directory is ignored by Git. This is a local development build, not Developer ID signed, notarized or verified for distribution. Rebuilding changes its signature and may require macOS permission to be granted again.

## Connect to the web workspace

1. Start the local API and web app using the repository README.
2. Start a workspace session and turn recording on in the web interface. Copy its capture connection.
3. In the companion, press **Paste connection copied from workspace**. This reads the clipboard once in response to your click; it does not monitor the clipboard. The imported bearer token remains in memory. The clipboard may still contain it, so replace the clipboard after importing.
4. Press **Request screen capture permission** to register the running app with macOS and open its permission prompt. The user must approve it in **System Settings → Privacy & Security → Screen & System Audio Recording**. Quit and reopen if macOS requests it. Then press **Load windows** and select only the synthetic demonstration window. The companion does not capture itself. If the intended window is on another Space, explicitly enable **Include windows on other Spaces** and reload; this expands discovery only and never starts capture automatically. Minimized or unavailable windows may still fail to produce images.
5. Press **Consent and capture**. Changed JPEG frames are uploaded approximately every two seconds plus processing and network time; identical frames are skipped. The counters distinguish sample checks from changed uploads. A heartbeat maintains the workspace recording lease even while the selected window is static.
6. Press **Off record** to stop local capture and cancel in-flight requests immediately, then pause the workspace. If the workspace pause fails, the UI states that it is unconfirmed. A server recording epoch rejects stale frames. Closing the window or quitting also stops local capture and attempts a workspace pause.

Only HTTP `localhost` and `127.0.0.1` origins are accepted. Redirects are blocked, tokens are not written to disk, and server errors are not printed with credentials. A cloud workspace needs a separately reviewed native authentication and connection flow; this local client does not accept arbitrary cloud endpoints.

## What activity means

The first optional activity toggle uses an AppKit **local** event monitor and observes only the companion itself. A separate, explicit toggle enables a **global** event monitor for the selected external window. That mode requires both Accessibility trust and Input Monitoring permission already granted by the user; its automatic checks never request or grant permission. Missing permission leaves screen-only capture usable.

External events are accepted only when the selected window's owning app is frontmost and its foremost normal window matches the selected window ID. Mouse clicks must additionally lie inside that window's current bounds. Missing metadata or revoked permission fails closed. Uploaded categories are only mouse activity, typing activity or shortcut activity; the handler never reads key characters or key codes. Modifier flags distinguish shortcut versus typing and are never uploaded. Neither mode reads input values, clipboard contents or Accessibility trees, and global monitoring does not intercept or prevent a save. Separate **Request Accessibility permission** and **Request Input Monitoring permission** buttons invoke the OS request only after an explicit click; the user approves access in System Settings. [Apple's global event monitor documentation](https://developer.apple.com/documentation/appkit/nsevent/addglobalmonitorforevents(matching:handler:)) describes its read-only delivery and Accessibility requirement; [Input Monitoring preflight](https://developer.apple.com/documentation/coregraphics/cgpreflightlisteneventaccess()) checks existing access.

## Permission and runtime checks

If loading windows fails, check **System Settings → Privacy & Security → Screen & System Audio Recording** for Decision Echo Capture. Quit and reopen after changing permission if requested by macOS. Screen-only capture does not require Accessibility or microphone permission. Optional external activity requires user-granted **Accessibility** and **Input Monitoring** in the same Privacy & Security panel; it never grants those permissions automatically. **Check external activity permission** displays actual screen, Accessibility and Input Monitoring preflight status.

An ad-hoc rebuild can leave the Settings switch on while the new running binary reports screen capture not granted. Quit and reopen the app first. If its preflight still reports not granted, the user should turn the app's Settings permission off and on again for the updated build, then reopen it. Finish rebuilding before granting permission so subsequent test runs use the same signature.

`swift test` verifies loopback restriction, session-path validation, header-injection rejection, recording/epoch authority and activity scope rejection for other apps, other windows and out-of-window clicks. Building and opening the bundle verifies packaging and UI startup. Actual selected-window capture, permission behavior, uploads, external activity, remote pause and quit cancellation must also be checked on a consenting machine with a synthetic window; passing core tests alone does not prove those runtime interactions.

Verified locally on 2026-10-04: five Swift core tests passed; the release app built, its plist linted and ad-hoc signature verified; the final app launched and its controls were inspected. Its own preflight displayed **Screen capture: not granted · Accessibility: not granted · Input Monitoring: not granted**, with both optional activity toggles off and zero sample checks/uploads. No permission was granted and no private window was captured. Native screenshot delivery, event delivery and live cancellation remain unverified until a user grants the relevant permission and a synthetic-window runtime test is completed.
