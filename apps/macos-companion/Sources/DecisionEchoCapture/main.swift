import AppKit
import SwiftUI
import ScreenCaptureKit
import CoreImage
import CaptureCore
import ApplicationServices

@main struct CaptureApp: App {
    @NSApplicationDelegateAdaptor(CaptureAppDelegate.self) private var delegate
    @StateObject private var capture = CaptureModel()
    var body: some Scene { WindowGroup { CaptureView(model: capture).onAppear { delegate.capture = capture } }.defaultSize(width: 560, height: 650) }
}
@MainActor final class CaptureAppDelegate: NSObject, NSApplicationDelegate {
    weak var capture: CaptureModel?
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        guard let capture else { return .terminateNow }
        capture.stopLocally()
        Task { await capture.pauseWorkspace(); sender.reply(toApplicationShouldTerminate: true) }
        return .terminateLater
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
struct CaptureView: View {
    @ObservedObject var model: CaptureModel
    var body: some View {
        ScrollView { VStack(alignment: .leading, spacing: 12) {
            Text("Decision Echo — selected window capture").font(.title2)
            Text("Explicitly select one window. Frames may contain personal information. No typed content, clipboard or Accessibility tree is collected.")
            TextField("Workspace HTTP loopback origin", text: $model.endpoint).disabled(model.recording || model.pausing)
            TextField("Session ID", text: $model.sessionID).disabled(model.recording || model.pausing)
            SecureField("Bearer token (memory only)", text: $model.token).disabled(model.recording || model.pausing)
            Button("Paste connection copied from workspace") { model.pasteConnection() }.disabled(model.recording || model.pausing)
            Text("This button reads the clipboard once, only to import the connection. Clipboard contents are never captured as evidence.").font(.caption)
            Button("Request screen capture permission") { model.requestScreenPermission() }.disabled(model.recording || model.pausing)
            Toggle("Include windows on other Spaces", isOn: $model.includeOtherSpaces).disabled(model.recording || model.pausing)
            Button("Load windows (requests screen permission)") { Task { await model.loadWindows() } }.disabled(model.recording || model.pausing)
            Picker("Window", selection: $model.selected) {
                Text("Choose a window").tag(UInt32(0))
                ForEach(model.windows, id: \.windowID) { window in
                    Text("\(window.owningApplication?.applicationName ?? "App") — \(window.title ?? "Window")").tag(window.windowID)
                }
            }.disabled(model.recording || model.pausing)
            Toggle("Also observe mouse/shortcut activity while this app is focused", isOn: $model.activityConsent)
                .disabled(model.recording)
            Text("This toggle observes the companion itself only. External-window activity has separate consent below.").font(.caption)
            Toggle("Also observe activity in the selected external window", isOn: $model.externalActivityConsent).disabled(model.recording)
            Text("Optional external activity sends only click, typing or shortcut categories, never keys or text. It requires user-granted Accessibility and Input Monitoring permission.").font(.caption)
            Button("Check external activity permission") { model.checkActivityPermission() }
            HStack {
                Button("Request Accessibility permission") { model.requestAccessibilityPermission() }
                Button("Request Input Monitoring permission") { model.requestInputPermission() }
            }.disabled(model.recording || model.pausing)
            Text(model.permissionStatus).font(.caption)
            HStack {
                Button("Consent and capture") { Task { await model.start() } }.disabled(model.recording || model.pausing)
                Button("Off record") { model.stopLocally(); Task { await model.pauseWorkspace() } }
            }
            Text(model.status).accessibilityLabel("Capture status")
            Text("\(model.samples) checks · \(model.uploads) changed frames uploaded").font(.caption)
        }.padding() }.onAppear { model.checkActivityPermission() }.onDisappear { model.stopLocally(); Task { await model.pauseWorkspace() } }
    }
}
@MainActor final class CaptureModel: ObservableObject {
    @Published var endpoint = "http://127.0.0.1:8787"
    @Published var sessionID = ""
    @Published var token = ""
    @Published var windows: [SCWindow] = []
    @Published var selected: UInt32 = 0
    @Published var includeOtherSpaces = false
    @Published var activityConsent = false
    @Published var externalActivityConsent = false
    @Published var permissionStatus = "External activity permission not checked"
    @Published var recording = false
    @Published var pausing = false
    @Published var status = "Not recording"
    @Published var samples = 0
    @Published var uploads = 0
    private var activityBusy = false
    private var epoch = 0
    private var generation = 0
    private var runner: Task<Void, Never>?
    private var pauseTask: Task<Void, Never>?
    private var monitor: Any?
    private var externalMonitor: Any?
    private var connection: CaptureConnection?
    private var requests: [UUID: URLSession] = [:]
    private var lastFrame: Data?

    func checkActivityPermission() {
        permissionStatus = "Screen capture: \(CGPreflightScreenCaptureAccess() ? "granted" : "not granted") · Accessibility: \(AXIsProcessTrusted() ? "granted" : "not granted") · Input Monitoring: \(CGPreflightListenEventAccess() ? "granted" : "not granted")"
    }
    func requestScreenPermission() {
        guard !recording, !pausing else { return }
        let allowed = CGRequestScreenCaptureAccess()
        status = allowed ? "Screen capture permission granted. Load windows next." : "Grant Decision Echo Capture in System Settings → Privacy & Security → Screen & System Audio Recording. Quit and reopen if macOS requests it."
        checkActivityPermission()
    }
    func requestAccessibilityPermission() {
        guard !recording, !pausing else { return }
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
        _ = AXIsProcessTrustedWithOptions(options)
        checkActivityPermission()
    }
    func requestInputPermission() {
        guard !recording, !pausing else { return }
        _ = CGRequestListenEventAccess()
        checkActivityPermission()
    }

    func pasteConnection() {
        guard !recording, !pausing else { return }
        guard let text = NSPasteboard.general.string(forType: .string) else { status = "No connection text on clipboard"; return }
        do {
            let value = try CaptureConnection(json: text)
            endpoint = value.origin.absoluteString; sessionID = value.sessionID; token = value.token
            status = "Connection imported. Select a window before capture."
        } catch { status = "Clipboard does not contain a valid workspace connection" }
    }

    func loadWindows() async {
        guard !recording, !pausing else { return }
        do {
            windows = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: !includeOtherSpaces).windows
                .filter { $0.owningApplication?.processID != ProcessInfo.processInfo.processIdentifier }
            if !windows.contains(where: { $0.windowID == selected }) { selected = 0 }
            status = "Choose the synthetic demo window. \(windows.count) windows available."
        }
        catch { status = "Screen capture unavailable: \(error.localizedDescription)" }
    }
    func request(_ suffix: String = "", body: [String: Any]? = nil, using snapshot: CaptureConnection? = nil) async throws -> [String: Any] {
        guard let connection = snapshot ?? connection else { throw CaptureError.invalidConfiguration }
        var req = URLRequest(url: connection.url(for: suffix))
        req.setValue("Bearer \(connection.token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpMethod = body == nil ? "GET" : "POST"
        if let body { req.httpBody = try JSONSerialization.data(withJSONObject: body) }
        req.timeoutInterval = 10
        // Redirects are disabled, so a bearer token cannot be forwarded elsewhere.
        let session = URLSession(configuration: .ephemeral, delegate: NoRedirect(), delegateQueue: nil)
        let requestID = UUID(); requests[requestID] = session
        defer { session.invalidateAndCancel(); requests.removeValue(forKey: requestID) }
        let (data, response) = try await session.data(for: req)
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode) else { throw CaptureError.requestFailed }
        return try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
    }
    func authorized() async throws -> Bool {
        let current = try await request()
        return captureIsAuthorized(recording: current["recording"] as? Bool, currentEpoch: current["epoch"] as? Int, captureEpoch: epoch)
    }
    func start() async {
        guard !pausing else { return }
        stopLocally()
        let attempt = generation
        guard let window = windows.first(where: { $0.windowID == selected }) else { status = "Select a window first"; return }
        do {
            let sameConnection = URL(string: endpoint) == connection?.origin && sessionID == connection?.sessionID
            connection = try CaptureConnection(endpoint: endpoint, sessionID: sessionID, token: token.isEmpty && sameConnection ? connection?.token ?? "" : token)
            token = ""; samples = 0; uploads = 0; lastFrame = nil
            let current = try await request()
            guard generation == attempt else { return }
            guard current["recording"] as? Bool == true, let currentEpoch = current["epoch"] as? Int else { status = "Start recording in the workspace first"; return }
            epoch = currentEpoch; recording = true; generation += 1
            let mine = generation
            let filter = SCContentFilter(desktopIndependentWindow: window)
            let config = SCStreamConfiguration(); let scale = min(1.0, 1280.0 / max(window.frame.width, window.frame.height)); config.width = max(1, Int(window.frame.width * scale)); config.height = max(1, Int(window.frame.height * scale)); config.showsCursor = false
            status = "Recording selected window every 2 seconds"
            if activityConsent {
                monitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown, .keyDown]) { [weak self] event in
                    let shortcut = event.type == .keyDown && !event.modifierFlags.intersection([.command, .control, .option]).isEmpty
                    if event.type != .keyDown || shortcut {
                        Task { @MainActor [weak self] in await self?.activity(shortcut ? "Shortcut activity in companion" : "Mouse activity in companion", generation: mine) }
                    }
                    return event
                }
            }
            if externalActivityConsent {
                if AXIsProcessTrusted() && CGPreflightListenEventAccess(), let owner = window.owningApplication {
                    externalMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown, .keyDown]) { [weak self] event in
                        guard let self, self.recording, self.generation == mine else { return }
                        // Revocation and any scope uncertainty fail closed. Never inspect characters or keyCode.
                        guard AXIsProcessTrusted(), CGPreflightListenEventAccess() else {
                            if let monitor = self.externalMonitor { NSEvent.removeMonitor(monitor); self.externalMonitor = nil }
                            self.permissionStatus = "External activity stopped: OS permission revoked"; return
                        }
                        let visible = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
                        let foremost = visible.first { ($0[kCGWindowOwnerPID as String] as? Int32) == owner.processID && ($0[kCGWindowLayer as String] as? Int) == 0 }
                        let number = (foremost?[kCGWindowNumber as String] as? NSNumber)?.uint32Value
                        let bounds = (foremost?[kCGWindowBounds as String] as? NSDictionary).flatMap { CGRect(dictionaryRepresentation: $0) }
                        let point = event.type == .keyDown ? nil : event.cgEvent?.location
                        // Missing mouse coordinates must not fall through to the keyboard path.
                        guard event.type == .keyDown || point != nil,
                              activityIsInScope(selectedPID: owner.processID, frontmostPID: NSWorkspace.shared.frontmostApplication?.processIdentifier,
                                                selectedWindow: window.windowID, frontmostWindow: number, windowBounds: bounds, mousePoint: point) else { return }
                        let shortcut = event.type == .keyDown && !event.modifierFlags.intersection([.command, .control, .option]).isEmpty
                        let category = event.type == .keyDown ? (shortcut ? "Shortcut activity in selected window" : "Typing activity in selected window") : "Mouse activity in selected window"
                        Task { @MainActor [weak self] in await self?.activity(category, generation: mine, external: true) }
                    }
                    permissionStatus = externalMonitor == nil ? "External activity unavailable; screen capture only" : "External activity enabled for selected foreground window"
                } else {
                    permissionStatus = "External activity unavailable: grant Accessibility and Input Monitoring in System Settings, then restart capture. Screen capture continues."
                }
            }
            runner = Task { [weak self] in
                while !Task.isCancelled {
                    guard let self, self.recording, self.generation == mine else { return }
                    do {
                        let authorized = try await self.authorized()
                        guard !Task.isCancelled, self.recording, self.generation == mine else { return }
                        guard authorized else { self.stopLocally(); self.status = "Stopped: workspace capture authority changed"; return }
                        _ = try await self.request("heartbeat", body: ["epoch": self.epoch])
                        guard !Task.isCancelled, self.recording, self.generation == mine else { return }
                        let image = try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: config)
                        guard !Task.isCancelled, self.recording, self.generation == mine else { return }
                        let bitmap = NSBitmapImageRep(cgImage: image)
                        var encoded: Data?
                        for quality in [0.55, 0.35, 0.18] {
                            if let candidate = bitmap.representation(using: .jpeg, properties: [.compressionFactor: quality]), candidate.count <= 375_000 {
                                encoded = candidate; break
                            }
                        }
                        guard let jpeg = encoded else { throw CaptureError.frameTooLarge }
                        let uploadAuthorized = try await self.authorized()
                        guard !Task.isCancelled, self.recording, self.generation == mine else { return }
                        guard uploadAuthorized else { self.stopLocally(); return }
                        self.samples += 1
                        if jpeg != self.lastFrame {
                            _ = try await self.request("evidence", body: ["epoch": self.epoch, "kind": "frame", "text": "Consented selected-window screenshot", "image": "data:image/jpeg;base64," + jpeg.base64EncodedString()])
                            guard self.recording, self.generation == mine else { return }
                            self.lastFrame = jpeg; self.uploads += 1
                        }
                        try await Task.sleep(for: .seconds(2))
                    } catch { if self.generation == mine { self.stopLocally(); self.status = "Capture stopped: \(error.localizedDescription)" }; return }
                }
            }
        } catch { if generation == attempt { stopLocally(); status = "Capture failed: \(error.localizedDescription)" } }
    }
    func activity(_ text: String, generation mine: Int, external: Bool = false) async {
        guard recording, generation == mine, external ? externalActivityConsent : activityConsent, !activityBusy else { return }
        activityBusy = true
        defer { activityBusy = false }
        do {
            guard try await authorized(), recording, generation == mine else { return }
            guard !external || (AXIsProcessTrusted() && CGPreflightListenEventAccess()) else {
                permissionStatus = "External activity stopped: OS permission revoked"; return
            }
            _ = try await request("evidence", body: ["epoch": epoch, "kind": "activity", "text": text])
        } catch { if recording, generation == mine { status = "Activity upload failed" } }
    }
    func stopLocally() {
        // Closing the window and quitting can both request a stop. Do not cancel their shared remote pause.
        if pausing && !recording { return }
        recording = false; generation += 1; runner?.cancel(); runner = nil
        requests.values.forEach { $0.invalidateAndCancel() }; requests.removeAll()
        lastFrame = nil
        if let monitor { NSEvent.removeMonitor(monitor); self.monitor = nil }
        if let externalMonitor { NSEvent.removeMonitor(externalMonitor); self.externalMonitor = nil }
        status = "Local capture stopped"
    }
    func pauseWorkspace() async {
        if let task = pauseTask { await task.value; return }
        guard let snapshot = connection else { return }
        pausing = true
        let attempt = generation
        let task = Task { [weak self] in
            guard let self else { return }
            await self.performPause(snapshot: snapshot, generation: attempt)
            self.pausing = false; self.pauseTask = nil
        }
        pauseTask = task
        await task.value
    }
    private func performPause(snapshot: CaptureConnection, generation attempt: Int) async {
        do {
            let current = try await request(using: snapshot)
            guard generation == attempt else { return }
            let pauseEpoch = current["epoch"] as? Int ?? epoch
            _ = try await request("recording", body: ["recording": false, "epoch": pauseEpoch], using: snapshot)
            if generation == attempt { status = "Off record: workspace capture stopped" }
        } catch { if generation == attempt { status = "Local capture stopped; workspace pause unconfirmed" } }
    }
}
final class NoRedirect: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
enum CaptureError: LocalizedError {
    case invalidConfiguration, requestFailed, frameTooLarge
    var errorDescription: String? {
        switch self {
        case .invalidConfiguration: return "Import a workspace connection first."
        case .requestFailed: return "The workspace rejected the request or could not be reached. Recheck connection and recording status."
        case .frameTooLarge: return "The selected-window image exceeds the upload budget. Select a smaller demo window."
        }
    }
}
