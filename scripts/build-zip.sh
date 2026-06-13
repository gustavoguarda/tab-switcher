#!/usr/bin/env bash
# Builds the store-ready ZIP with only the runtime files (manifest at the root).
# Excludes dev/test/docs/build artifacts. Output: dist/tab-switcher-<version>.zip
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="$(sed -nE 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' manifest.json | head -1)"
VERSION="${VERSION:-dev}"
OUT="dist/tab-switcher-${VERSION}.zip"

mkdir -p dist
rm -f "$OUT"

# Ship only what the extension loads at runtime. -q keeps output clean.
zip -q -r -X "$OUT" \
  manifest.json \
  src \
  _locales \
  icons/icon16.png \
  icons/icon48.png \
  icons/icon128.png \
  -x '*/.DS_Store' '.DS_Store'

echo "Built $OUT"
echo "Contents:"
unzip -Z1 "$OUT" | sed 's/^/  /'
