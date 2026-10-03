import AppKit
import SwiftUI
import ScreenCaptureKit
import CoreImage

@main struct CaptureApp: App {
    @StateObject private var capture = CaptureModel()
    var body: some Scene { WindowGroup { CaptureView(model: capture) }.defaultSize(width: 520, height: 480) }
}
struct CaptureView: View {
    @ObservedObject var model: CaptureModel
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Decision Echo — selected window capture").font(.title2)
            Text("Explicitly select one window. Frames may contain personal information. No typed content, clipboard or Accessibility tree is collected.")
            TextField("Workspace HTTP loopback origin", text: $model.endpoint)
            TextField("Session ID", text: $model.sessionID)
            SecureField("Bearer token (memory only)", text: $model.token)
            Button("Load windows (requests screen permission)") { Task { await model.loadWindows() } }
            Picker("Window", selection: $model.selected) {
                Text("Choose a window").tag(UInt32(0))
                ForEach(model.windows, id: \.windowID) { window in
                    Text("\(window.owningApplication?.applicationName ?? "App") — \(window.title ?? "Window")").tag(window.windowID)
                }
            }
            Toggle("Also observe mouse/shortcut activity while this app is focused", isOn: $model.activityConsent)
            HStack {
                Button("Consent and capture") { Task { await model.start() } }.disabled(model.recording)
                Button("Off record") { model.stopLocally(); Task { await model.pauseWorkspace() } }
            }
            Text(model.status).accessibilityLabel("Capture status")
        }.padding().onDisappear { model.stopLocally() }
    }
}
@MainActor final class CaptureModel: ObservableObject {
    @Published var endpoint = "http://localhost:8787"
    @Published var sessionID = ""
    @Published var token = ""
    @Published var windows: [SCWindow] = []
    @Published var selected: UInt32 = 0
    @Published var activityConsent = false
    @Published var recording = false
    @Published var status = "Not recording"
    private var activityBusy = false
    private var epoch = 0
    private var generation = 0
    private var runner: Task<Void, Never>?
    private var monitor: Any?
    private var configuredURL: URL?
    private var configuredSession = ""
    private var configuredToken = ""
    private let context = CIContext()

    func loadWindows() async {
        do { windows = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: true).windows }
        catch { status = "Screen capture unavailable: \(error.localizedDescription)" }
    }
    func request(_ suffix: String = "", body: [String: Any]? = nil) async throws -> [String: Any] {
        guard let origin = configuredURL else { throw CaptureError.invalidConfiguration }
        let url = origin.appendingPathComponent("api").appendingPathComponent("sessions").appendingPathComponent(configuredSession).appendingPathComponent(suffix)
        var req = URLRequest(url: url)
        req.setValue("Bearer \(configuredToken)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpMethod = body == nil ? "GET" : "POST"
        if let body { req.httpBody = try JSONSerialization.data(withJSONObject: body) }
        req.timeoutInterval = 10
        // Redirects are disabled, so a bearer token cannot be forwarded elsewhere.
        let session = URLSession(configuration: .ephemeral, delegate: NoRedirect(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        let (data, response) = try await session.data(for: req)
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode) else { throw CaptureError.requestFailed }
        return try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
    }
    func authorized() async throws -> Bool {
        let current = try await request()
        return current["recording"] as? Bool == true && current["epoch"] as? Int == epoch
    }
    func start() async {
        stopLocally()
        let attempt = generation
        guard let url = URL(string: endpoint), url.scheme == "http", ["localhost", "127.0.0.1"].contains(url.host ?? ""), url.user == nil, url.password == nil, url.query == nil, url.fragment == nil, ["", "/"].contains(url.path), !sessionID.isEmpty, !token.isEmpty,
              let window = windows.first(where: { $0.windowID == selected }) else { status = "Select a window, loopback endpoint and session credentials"; return }
        configuredURL = url; configuredSession = sessionID; configuredToken = token; token = ""
        do {
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
            runner = Task { [weak self] in
                while !Task.isCancelled {
                    guard let self, self.recording, self.generation == mine else { return }
                    do {
                        guard try await self.authorized() else { self.stopLocally(); self.status = "Stopped: workspace capture authority changed"; return }
                        let image = try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: config)
                        guard !Task.isCancelled, self.recording, self.generation == mine else { return }
                        let ci = CIImage(cgImage: image)
                        guard let jpeg = self.context.jpegRepresentation(of: ci, colorSpace: CGColorSpaceCreateDeviceRGB(), options: [:]) else { throw CaptureError.requestFailed }
                        guard try await self.authorized(), self.recording, self.generation == mine else { self.stopLocally(); return }
                        _ = try await self.request("evidence", body: ["epoch": self.epoch, "kind": "frame", "text": "Consented selected-window screenshot", "image": "data:image/jpeg;base64," + jpeg.base64EncodedString()])
                        try await Task.sleep(for: .seconds(2))
                    } catch { if self.generation == mine { self.stopLocally(); self.status = "Capture stopped: \(error.localizedDescription)" }; return }
                }
            }
        } catch { stopLocally(); status = "Capture failed: \(error.localizedDescription)" }
    }
    func activity(_ text: String, generation mine: Int) async {
        guard recording, generation == mine, activityConsent, !activityBusy else { return }
        activityBusy = true
        defer { activityBusy = false }
        do {
            guard try await authorized(), recording, generation == mine else { return }
            _ = try await request("evidence", body: ["epoch": epoch, "kind": "activity", "text": text])
        } catch { status = "Activity upload failed" }
    }
    func stopLocally() {
        recording = false; generation += 1; runner?.cancel(); runner = nil
        if let monitor { NSEvent.removeMonitor(monitor); self.monitor = nil }
        status = "Local capture stopped"
    }
    func pauseWorkspace() async {
        guard configuredURL != nil else { return }
        do { let current = try await request(); epoch = current["epoch"] as? Int ?? epoch; _ = try await request("recording", body: ["recording": false, "epoch": epoch]); status = "Off record: workspace capture stopped" }
        catch { status = "Local capture stopped; workspace pause unconfirmed" }
    }
}
final class NoRedirect: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
enum CaptureError: Error { case invalidConfiguration, requestFailed }
