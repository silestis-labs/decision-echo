import XCTest
import CoreGraphics
@testable import CaptureCore

final class ConnectionTests: XCTestCase {
    func testConnectionPayloadAndURL() throws {
        let value = try CaptureConnection(json: "{\"endpoint\":\"http://127.0.0.1:8787\",\"id\":\"demo-session\",\"token\":\"test-token\"}")
        XCTAssertEqual(value.url(for: "evidence").absoluteString, "http://127.0.0.1:8787/api/sessions/demo-session/evidence")
    }
    func testRejectsCredentialExfiltrationOrigins() {
        for origin in ["https://example.com", "http://127.0.0.1.example.com", "http://user@localhost:8787", "http://localhost:8787/proxy", "http://localhost:8787?forward=1", "http://localhost:8787#fragment"] {
            XCTAssertThrowsError(try CaptureConnection(endpoint: origin, sessionID: "demo", token: "test"), origin)
        }
    }
    func testRejectsSessionTraversalAndHeaderInjection() {
        for id in ["../private", "a/b", "", "a?token=b"] {
            XCTAssertThrowsError(try CaptureConnection(endpoint: "http://localhost:8787", sessionID: id, token: "test"))
        }
        XCTAssertThrowsError(try CaptureConnection(endpoint: "http://localhost:8787", sessionID: "demo", token: "test\r\nInjected: true"))
        XCTAssertThrowsError(try CaptureConnection(endpoint: "http://localhost:8787", sessionID: "demo", token: "test\0token"))
    }
    func testOffRecordAndEpochChangesInvalidateAuthority() {
        XCTAssertTrue(captureIsAuthorized(recording: true, currentEpoch: 3, captureEpoch: 3))
        XCTAssertFalse(captureIsAuthorized(recording: false, currentEpoch: 3, captureEpoch: 3))
        XCTAssertFalse(captureIsAuthorized(recording: true, currentEpoch: 4, captureEpoch: 3))
        XCTAssertFalse(captureIsAuthorized(recording: nil, currentEpoch: nil, captureEpoch: 0))
    }
    func testExternalActivityCannotEscapeSelectedWindow() {
        let bounds = CGRect(x: 10, y: 10, width: 100, height: 100)
        XCTAssertTrue(activityIsInScope(selectedPID: 5, frontmostPID: 5, selectedWindow: 7, frontmostWindow: 7, windowBounds: bounds, mousePoint: CGPoint(x: 20, y: 20)))
        XCTAssertFalse(activityIsInScope(selectedPID: 5, frontmostPID: 6, selectedWindow: 7, frontmostWindow: 7, windowBounds: bounds, mousePoint: nil))
        XCTAssertFalse(activityIsInScope(selectedPID: 5, frontmostPID: 5, selectedWindow: 7, frontmostWindow: 8, windowBounds: bounds, mousePoint: nil))
        XCTAssertFalse(activityIsInScope(selectedPID: 5, frontmostPID: 5, selectedWindow: 7, frontmostWindow: 7, windowBounds: bounds, mousePoint: CGPoint(x: 200, y: 200)))
        XCTAssertFalse(activityIsInScope(selectedPID: 5, frontmostPID: 5, selectedWindow: 7, frontmostWindow: nil, windowBounds: nil, mousePoint: nil))
    }
}
