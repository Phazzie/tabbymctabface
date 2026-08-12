#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 20/22 and npm are required." >&2
  exit 1
fi

echo "Running the TabbyMcTabface release gate with Node $(node --version)..."
npm run verify

echo "Checking production dependencies..."
npm audit --omit=dev

echo "Pre-flight complete: tests, build, package, browser smoke, and production audit passed."
