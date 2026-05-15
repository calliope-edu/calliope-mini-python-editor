#!/usr/bin/env bash
#
# Builds the MicroPython simulator from source (submodule at simulator-src/)
# and copies the artifacts into public/simulator/ so the editor build picks
# them up.
#
# Cloudflare Pages does NOT run this — public/simulator/ is committed.
# Run this locally (or in a dedicated CI job) whenever the simulator submodule
# is bumped, then commit the diff under public/simulator/.
#
# Prerequisites:
#   - Linux or macOS (or WSL on Windows).
#   - Emscripten SDK on PATH. To install:
#       git clone https://github.com/emscripten-core/emsdk.git ~/.emsdk
#       ~/.emsdk/emsdk install 3.1.25
#       ~/.emsdk/emsdk activate 3.1.25
#       source ~/.emsdk/emsdk_env.sh
#   - Python 3.7+ (for Emscripten), GNU make, a C toolchain.
#
# Usage:
#   bin/build-simulator.sh
#

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d simulator-src/src ]; then
  echo "simulator-src/ submodule not initialised. Run:" >&2
  echo "  git submodule update --init --recursive simulator-src" >&2
  exit 1
fi

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc not found on PATH." >&2
  echo "Activate Emscripten first: source ~/.emsdk/emsdk_env.sh" >&2
  exit 1
fi

# Ensure the nested MicroPython submodule is present.
git -C simulator-src submodule update --init lib/micropython-calliope-mini-v3
git -C simulator-src/lib/micropython-calliope-mini-v3 submodule update --init lib/micropython

echo "==> Building simulator (this takes a few minutes)..."
make -C simulator-src clean
make -C simulator-src

OUT_DIR="public/simulator"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# `make` populates simulator-src/build/ with the deployable layout
# (simulator.html, term.js, examples/, build/firmware.js,
# build/firmware.wasm, build/simulator.js).
cp -r simulator-src/build/. "$OUT_DIR/"

echo
echo "==> Done. Diff under $OUT_DIR/ ready to commit."
ls -la "$OUT_DIR"
