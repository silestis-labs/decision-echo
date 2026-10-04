#!/bin/bash
set -euo pipefail
fixture_sources="$(cd "$(dirname "$0")" && pwd)"
fixture_root="${TMPDIR:-/private/tmp}/decision-echo-native-fixture"
fixture_bundle="$fixture_root/Decision Echo Synthetic Fixture.app"
mkdir -p "$fixture_bundle/Contents/MacOS" "$fixture_root/module-cache"
swiftc -parse-as-library -module-cache-path "$fixture_root/module-cache" "$fixture_sources/CaptureFixture.swift" -o "$fixture_bundle/Contents/MacOS/CaptureFixture"
cat > "$fixture_bundle/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>dev.decisionecho.capturefixture</string><key>CFBundleName</key><string>Decision Echo Synthetic Fixture</string><key>CFBundleExecutable</key><string>CaptureFixture</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>
PLIST
codesign --force --sign - "$fixture_bundle"
printf '%s\n' "$fixture_bundle"
