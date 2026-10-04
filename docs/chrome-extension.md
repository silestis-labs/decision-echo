# Chrome capture companion

The Manifest V3 extension contributes selected-tab evidence to a Decision Echo web session. It is an optional capture client; the web workspace runs Capture, Work Map and Teach. It does not intercept arbitrary application saves.

## Use it locally

1. Run the workspace at `http://127.0.0.1:5173` and its API at `http://127.0.0.1:8787`.
2. In `chrome://extensions`, enable Developer mode and load the `apps/chrome-extension` directory unpacked. Pin its toolbar action.
3. Open the extension side panel. It displays its exact `chrome-extension://…` origin. Configure that value as server-side `EXTENSION_ORIGIN` in your ignored `.dev.vars`, then restart the API. Do not enter provider API keys into the extension.
4. Start a recording in the web workspace and explicitly reveal its optional-client session capability. Enter the session ID and bearer token into the panel. This capability grants access to that session; keep the entry panel out of screen recordings.
5. Enter the exact target origin, such as `https://www.notion.so` or `http://127.0.0.1:5173`, without a path. Select the target tab and **click the extension toolbar action on that tab**. This user gesture grants Chrome's temporary `activeTab` permission. Opening `panel.html` directly does not grant screenshot permission.
6. Choose whether to include visible screenshots, then click **Consent and capture current tab**. Inspect the status. Screenshot permission errors explain how to grant access; the extension never escalates to all-site capture.
7. **Off record** stops local capture synchronously and requests a session-wide pause. To restart, activate recording in the workspace and consent again. The bearer stays only in this panel's memory, so restarts do not require re-entry. **Forget local credentials** clears it and stops local capture, without claiming to pause the entire workspace. Closing the panel also stops local capture and clears its memory.

The endpoint permits HTTP loopback origins only. Hosted Cloudflare endpoints are not supported by this extension version. Local development host permissions do not grant access to all websites; target-page injection requires the toolbar action's `activeTab` grant.

## Capture and privacy

The extension emits clicked control names and generic typing/shortcut categories. Editable controls are reported by type, without their values. It does not record key characters, modifier combinations, clipboard or browser history. Button labels and screenshots may still contain personal data: use a synthetic workspace for demonstrations.

Optional visible-tab screenshots run approximately every two seconds. Frames are resized to a maximum dimension of 1280 pixels and JPEG-compressed, with the evidence size limit checked before upload. The selected tab must remain active in its window and on the allowed origin. Activity may continue from that selected tab when another tab is active, but screenshots do not. Navigation or closing the target stops the session locally and requires fresh consent.

One pending operation serializes authority validation, capture and upload. Local stop aborts requests and invalidates the capture generation, so a delayed screenshot cannot cross a same-epoch restart. Idle capture refreshes the server recording lease with `POST /heartbeat`; server pause, epoch change or heartbeat failure stops capture. No evidence queue is replayed after resumption. A remote pause is detected on the next poll; server epoch checks reject stale uploads immediately.

## Verification

Run:

```sh
node apps/chrome-extension/panel.test.mjs
node apps/chrome-extension/runtime.test.mjs
TEST_WORKER=1 node apps/chrome-extension/runtime.test.mjs
```

The first test executes the panel code with mocked Chrome/network APIs, covering current-epoch off-record, bearer transport, loopback rejection, same-epoch delayed screenshot rejection and heartbeat refresh.

The second loads the actual unpacked extension in a disposable Chromium profile with a synthetic HTTP backend and target page. It exercises content-script injection, clicked-control and shortcut metadata, exclusion of typed values, authenticated HTTP exchange, local pause, remote epoch pause, navigation stop, memory-only credential reuse and forgetting. It also verifies actual Chrome screenshot denial without the toolbar permission gesture. It uses no personal browser profile or cookies.

The default test backend is synthetic. The optional `TEST_WORKER=1` mode instead launches the actual local Cloudflare Worker and SQLite Durable Object with a temporary configuration, the isolated extension’s exact allowed origin and disposable persisted state. It does not load project `.dev.vars`, use provider credentials, invoke models/voice or deploy. This mode verifies real session capability authentication, exact-origin CORS, activity evidence, heartbeat, local/remote pause and stale-epoch rejection. It passed on the development machine.

Toolbar-granted screenshots on arbitrary sites, the Chrome side-panel toolbar interaction, your installed extension’s configured Worker origin and Chrome Web Store distribution require separate manual/runtime verification. These are not inferred from mocked tests or compilation.
