import AppKit
@main struct Fixture {
    static func main() {
        let app = NSApplication.shared
        let delegate = FixtureDelegate()
        app.delegate = delegate
        app.setActivationPolicy(.regular)
        app.run()
    }
}
final class FixtureDelegate: NSObject, NSApplicationDelegate {
    private var window: NSWindow!
    private let plan = NSTextField(labelWithString: "Synthetic plan: Lea — Thursday 09:00–13:00")
    private var moved = false
    func applicationDidFinishLaunching(_ notification: Notification) {
        window = NSWindow(contentRect: NSRect(x: 240,y: 240,width: 680,height: 340),styleMask: [.titled,.closable,.miniaturizable],backing: .buffered,defer: false)
        window.title = "Decision Echo Synthetic Fixture"
        let heading = NSTextField(labelWithString: "Synthetic native capture test — no personal data")
        heading.font = .boldSystemFont(ofSize: 22)
        plan.font = .systemFont(ofSize: 20)
        let button = NSButton(title: "Move synthetic task",target: self,action: #selector(moveTask))
        let stack = NSStackView(views: [heading,plan,button])
        stack.orientation = .vertical;stack.alignment = .leading;stack.spacing = 32
        stack.translatesAutoresizingMaskIntoConstraints = false
        window.contentView!.addSubview(stack)
        NSLayoutConstraint.activate([stack.leadingAnchor.constraint(equalTo: window.contentView!.leadingAnchor,constant: 28),stack.centerYAnchor.constraint(equalTo: window.contentView!.centerYAnchor)])
        window.center();window.makeKeyAndOrderFront(nil);NSApplication.shared.activate(ignoringOtherApps: true)
    }
    @objc private func moveTask() {
        moved.toggle()
        plan.stringValue = moved ? "Synthetic plan: Lea — Friday 08:00–12:00" : "Synthetic plan: Lea — Thursday 09:00–13:00"
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
