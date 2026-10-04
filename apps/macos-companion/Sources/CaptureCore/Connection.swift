import Foundation
import CoreGraphics

public struct CaptureConnection: Equatable {
    public let origin: URL
    public let sessionID: String
    public let token: String

    public init(endpoint: String, sessionID: String, token: String) throws {
        guard let url = URL(string: endpoint.trimmingCharacters(in: .whitespacesAndNewlines)),
              url.scheme == "http", ["localhost", "127.0.0.1"].contains(url.host ?? ""),
              url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
              ["", "/"].contains(url.path),
              !sessionID.isEmpty, sessionID.count <= 128,
              sessionID.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "-" || $0 == "_") }),
              !token.isEmpty, token.count <= 4096,
              token.unicodeScalars.allSatisfy({ (33...126).contains($0.value) }) else {
            throw ConnectionError.invalidConfiguration
        }
        self.origin = url
        self.sessionID = sessionID
        self.token = token
    }

    public init(json: String) throws {
        guard let data = json.data(using: .utf8), data.count <= 8192,
              let value = try JSONSerialization.jsonObject(with: data) as? [String: String],
              let endpoint = value["endpoint"], let id = value["id"] ?? value["sessionId"], let token = value["token"] else {
            throw ConnectionError.invalidConfiguration
        }
        try self.init(endpoint: endpoint, sessionID: id, token: token)
    }

    public func url(for suffix: String = "") -> URL {
        origin.appendingPathComponent("api").appendingPathComponent("sessions").appendingPathComponent(sessionID).appendingPathComponent(suffix)
    }
}

public enum ConnectionError: LocalizedError {
    case invalidConfiguration
    public var errorDescription: String? {
        "Use an HTTP localhost or 127.0.0.1 origin, a valid session ID and a bearer token without whitespace."
    }
}

/// The authority returned by the workspace must match the capture epoch before every upload.
public func captureIsAuthorized(recording: Bool?, currentEpoch: Int?, captureEpoch: Int) -> Bool {
    recording == true && currentEpoch == captureEpoch
}

/// Scope checks consume identifiers and coordinates only, never key values or window titles.
public func activityIsInScope(selectedPID: Int32, frontmostPID: Int32?, selectedWindow: UInt32,
                              frontmostWindow: UInt32?, windowBounds: CGRect?, mousePoint: CGPoint?) -> Bool {
    guard selectedPID == frontmostPID, selectedWindow == frontmostWindow, selectedWindow != 0 else { return false }
    if let mousePoint { return windowBounds?.contains(mousePoint) == true }
    return true
}
