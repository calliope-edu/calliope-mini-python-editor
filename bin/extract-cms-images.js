#!/usr/bin/env node
/**
 * Walks the CMS JSON snapshots, collects every Sanity image asset
 * reference, and downloads the original-resolution file to
 * public/cms/images/.
 *
 * Pair with bin/extract-cms.js when refreshing content. Images are
 * served at /cms/images/<id>-<WxH>.<ext> from the editor's own origin —
 * no Sanity CDN at runtime.
 *
 * Sanity asset refs look like:  image-<sha>-<W>x<H>-<ext>
 * CDN URL pattern:  https://cdn.sanity.io/images/<project>/<dataset>/<sha>-<W>x<H>.<ext>
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ID = "hmru2910";
const DATASET = "production";
const CDN_BASE = `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}`;

const snapshotDir = path.join(__dirname, "..", "src", "documentation", "cms-snapshot");
const outDir = path.join(__dirname, "..", "public", "cms", "images");

const refRegex = /"_ref"\s*:\s*"(image-[A-Za-z0-9]+-\d+x\d+-[A-Za-z0-9]+)"/g;

function collectRefs() {
  const refs = new Set();
  for (const file of fs.readdirSync(snapshotDir)) {
    if (!file.endsWith(".json")) continue;
    const body = fs.readFileSync(path.join(snapshotDir, file), "utf8");
    let m;
    while ((m = refRegex.exec(body)) !== null) {
      refs.add(m[1]);
    }
  }
  return [...refs];
}

function refToFilename(ref) {
  // image-abc-1024x768-jpg -> abc-1024x768.jpg
  const without = ref.replace(/^image-/, "");
  const lastDash = without.lastIndexOf("-");
  return without.slice(0, lastDash) + "." + without.slice(lastDash + 1);
}

async function download(ref) {
  const filename = refToFilename(ref);
  const dest = path.join(outDir, filename);
  if (fs.existsSync(dest)) {
    return { ref, filename, size: fs.statSync(dest).size, cached: true };
  }
  const url = `${CDN_BASE}/${filename}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return { ref, filename, size: buf.length, cached: false };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const refs = collectRefs();
  console.log(`Found ${refs.length} unique image refs.`);

  let totalBytes = 0;
  let downloaded = 0;
  for (const ref of refs) {
    const r = await download(ref);
    totalBytes += r.size;
    if (!r.cached) downloaded++;
    console.log(`  ${r.cached ? "cached" : "  fetched"}  ${r.filename}  ${r.size.toLocaleString()} B`);
  }
  console.log(`\nDownloaded ${downloaded} new files (${refs.length} total, ${totalBytes.toLocaleString()} B on disk).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
