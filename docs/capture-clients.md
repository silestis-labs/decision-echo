# Capture clients

The browser workspace runs Capture → Work Map → Teach → Skill library. Optional clients contribute scoped evidence to that same authenticated session; they do not intercept arbitrary application saves.

Use the workspace at `http://127.0.0.1:5173` and local API at `http://127.0.0.1:8787`. Expand **Optional capture companions**, select **Start companion capture**, and copy the local connection to your trusted client. The browser polls incoming evidence and can observe external frames when vision is configured. Off-record invalidates the shared capture epoch.

- [Chrome extension](chrome-extension.md): unpacked MV3 installation, exact-origin CORS, selected-tab consent, activity metadata and optional screenshots. Actual isolated Chromium metadata/runtime checks pass; toolbar-granted screenshot capture needs a separate permission check.
- [macOS companion](macos-companion.md): SwiftUI selected-window capture, local app packaging, permissions, connection import and capture lifecycle. Consult its verification section for build versus hardware evidence.

## Shared authority

Collectors check authenticated recording state and epoch before uploading. They refresh the 60-second capture lease even when frames are unchanged. Local off-record cancels sensors and in-flight requests; a remote pause is noticed on the next poll, while stale uploads are rejected immediately by the server. There is no replay queue across a pause. Opening/recovering a browser session pauses it before resumption.

Both clients accept local HTTP loopback endpoints. Hosted connection/authentication, distribution signing and deployment are distinct release work. Keep bearer connection fields outside the selected recording surface; they grant access to the whole session. Pause does not delete previously received evidence. [Server setup](server-setup.md) documents lease, deletion and controlled-write boundaries.

## Tests

```sh
npm run test:extension
npm run test:extension:runtime
npm run test:lease
cd apps/macos-companion
swift test
bash scripts/build-app.sh
```

The extension runtime test uses a disposable real Chromium profile and a synthetic HTTP backend. The lease test uses the actual local Durable Object. Browser integration supplies a labeled synthetic canvas stream. These are separate checks, and none substitutes for OS screen-sharing permission or live provider testing. See [implementation results](reviews/implementation-results.md).
