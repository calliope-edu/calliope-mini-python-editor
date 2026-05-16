#!/usr/bin/env bash
#
# Builds the MicroPython simulator from source and overwrites
# public/simulator/ with the artifacts.
#
# Cloudflare Pages does NOT run this — public/simulator/ is committed
# and that's what gets served. Run this only when you actually want to
# update the simulator runtime (new MicroPython version, simulator bug
# fix, etc.) then `git add public/simulator/` and commit.
#
# The simulator source lives at https://github.com/calliope-edu/micropython-simulator.
# We clone it on demand under simulator-src/ (gitignored — see .gitignore).
# Pinned to a known-good SHA so this script reproduces the same output.
#
# Prerequisites:
#   - Linux or macOS (or WSL on Windows).
#   - Emscripten SDK on PATH. To install:
#       git clone https://github.com/emscripten-core/emsdk.git ~/.emsdk
#       ~/.emsdk/emsdk install 3.1.25
#       ~/.emsdk/emsdk activate 3.1.25
#       source ~/.emsdk/emsdk_env.sh
#   - Python 3.7+, GNU make, a C toolchain.
#
# Usage:
#   bin/build-simulator.sh

set -euo pipefail

cd "$(dirname "$0")/.."

# Pin the simulator to a known SHA so the committed public/simulator/
# stays reproducible across machines. Bump when you intentionally adopt
# a newer simulator build.
SIM_REPO="https://github.com/calliope-edu/micropython-simulator.git"
SIM_SHA="48799b8773ff53436493b2659895b4ddb6ed76c6"

if [ ! -d simulator-src ]; then
  echo "==> Cloning simulator source ($SIM_REPO @ $SIM_SHA)..."
  git clone "$SIM_REPO" simulator-src
fi

(
  cd simulator-src
  git fetch --quiet origin
  git checkout --quiet "$SIM_SHA"
  git submodule update --init --recursive
)

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc not found on PATH." >&2
  echo "Activate Emscripten first: source ~/.emsdk/emsdk_env.sh" >&2
  exit 1
fi

echo "==> Building simulator (this takes a few minutes)..."
make -C simulator-src clean
make -C simulator-src

OUT_DIR="public/simulator"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# `make` populates simulator-src/build/ with the deployable layout
# (simulator.html + build/firmware.js + build/firmware.wasm + build/simulator.js).
cp -r simulator-src/build/. "$OUT_DIR/"

echo
echo "==> Done. Diff under $OUT_DIR/ ready to commit."
ls -la "$OUT_DIR"
