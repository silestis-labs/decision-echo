// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "DecisionEchoCapture", platforms: [.macOS(.v14)], products: [.executable(name: "DecisionEchoCapture", targets: ["DecisionEchoCapture"])], targets: [.executableTarget(name: "DecisionEchoCapture")])
