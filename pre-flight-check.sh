#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 20/22 and npm are required." >&2
  exit 1
fi

if ! node -e '
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 20 || (major === 20 && minor < 19)) process.exit(1);
'; then
  echo "Node.js 20.19.0 or newer is required; found $(node --version)." >&2
  exit 1
fi

echo "Running the TabbyMcTabface release gate with Node $(node --version)..."
npm run verify

echo "Building the deterministic release archive..."
npm run package

echo "Pre-flight complete: tests, build, package, browser smoke, and dependency audit passed."
