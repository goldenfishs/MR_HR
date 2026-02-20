#!/bin/bash

set -euo pipefail

# Use Homebrew Node.js 18 first when available
export PATH="/opt/homebrew/opt/node@18/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

build_project() {
  local name="$1"
  local dir="$2"

  echo ""
  echo "=========================================="
  echo "Building ${name}..."
  echo "=========================================="

  if [ ! -d "$dir" ]; then
    echo "Error: directory not found: $dir"
    exit 1
  fi

  if [ ! -f "$dir/package.json" ]; then
    echo "Error: package.json not found in $dir"
    exit 1
  fi

  (cd "$dir" && npm run build)

  echo "${name} build completed."
}

echo "=========================================="
echo "Interview System - Build All"
echo "=========================================="
echo "Node version: $(node --version 2>/dev/null || echo 'Not found')"
echo "NPM version:  $(npm --version 2>/dev/null || echo 'Not found')"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is not installed or not in PATH"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in PATH"
  exit 1
fi

build_project "backend" "$SCRIPT_DIR/backend"
build_project "frontend" "$SCRIPT_DIR/frontend"

echo ""
echo "=========================================="
echo "All builds completed successfully."
echo "=========================================="
