#!/bin/bash
set -euo pipefail
# Produces a local development bundle, not a notarized distribution.
companion_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$companion_root"
swift build -c release
companion_bin="$(swift build -c release --show-bin-path)"
companion_app="$companion_root/build/Decision Echo Capture.app"
mkdir -p "$companion_app/Contents/MacOS" "$companion_app/Contents/Resources"
cp "$companion_bin/DecisionEchoCapture" "$companion_app/Contents/MacOS/DecisionEchoCapture"
cp "$companion_root/Info.plist" "$companion_app/Contents/Info.plist"
plutil -lint "$companion_app/Contents/Info.plist"
codesign --force --sign - "$companion_app"
codesign --verify --strict "$companion_app"
printf 'Built local development app: %s\n' "$companion_app"
