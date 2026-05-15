#!/usr/bin/env node
/**
 * Mirrors the staging MicroPython simulator build into public/simulator/
 * so the editor can serve it from its own origin.
 *
 * Source: https://staging.simulator.python.calliope.cc/ (built from
 * calliope-edu/micropython-simulator). The simulator is a static set of
 * files (HTML + JS + WASM) — no server-side logic.
 *
 * Usage:  node bin/extract-simulator.js
 */

const fs = require("fs");
const path = require("path");

const ORIGIN = "https://staging.simulator.python.calliope.cc";
const FILES = [
  "simulator.html",
  "build/simulator.js",
  "build/firmware.js",
  "build/firmware.wasm",
];

async function fetchTo(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  const outRoot = path.join(__dirname, "..", "public", "simulator");
  fs.mkdirSync(outRoot, { recursive: true });
  let totalBytes = 0;
  for (const rel of FILES) {
    const dest = path.join(outRoot, rel);
    const url = `${ORIGIN}/${rel}`;
    const size = await fetchTo(url, dest);
    totalBytes += size;
    console.log(`  ${rel}  ${size.toLocaleString()} B`);
  }
  console.log(`\nMirrored ${FILES.length} files (${totalBytes.toLocaleString()} B) into ${outRoot}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
