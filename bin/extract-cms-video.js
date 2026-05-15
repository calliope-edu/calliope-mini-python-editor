#!/usr/bin/env node
/**
 * Downloads a video from YouTube and transcodes it to HLS under
 * public/cms/videos/<slug>/. Idempotent: skips work if the output
 * already exists unless --force is passed.
 *
 * Usage:
 *   node bin/extract-cms-video.js <youtubeId> <slug> [--force]
 *
 * Example (welcome video):
 *   node bin/extract-cms-video.js 3GLASrxQ3Og welcome
 *
 * Requires `yt-dlp` and `ffmpeg` on PATH (yt-dlp via `python -m yt_dlp`
 * is also picked up as a fallback).
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd, args, opts = {}) {
  console.log(`+ ${cmd} ${args.join(" ")}`);
  return execFileSync(cmd, args, { stdio: "inherit", ...opts });
}

function ytDlp(args) {
  // Prefer `yt-dlp` on PATH; fall back to `python -m yt_dlp`.
  try {
    return run("yt-dlp", args);
  } catch {
    return run("python", ["-m", "yt_dlp", ...args]);
  }
}

function main() {
  const [, , youtubeId, slug, ...rest] = process.argv;
  const force = rest.includes("--force");
  if (!youtubeId || !slug) {
    console.error("Usage: node bin/extract-cms-video.js <youtubeId> <slug> [--force]");
    process.exit(2);
  }

  const outDir = path.join(__dirname, "..", "public", "cms", "videos", slug);
  const m3u8 = path.join(outDir, "index.m3u8");

  if (fs.existsSync(m3u8) && !force) {
    console.log(`${m3u8} already exists. Pass --force to re-extract.`);
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });

  // Wipe any previous output so we don't end up with stale segments.
  for (const f of fs.readdirSync(outDir)) {
    fs.rmSync(path.join(outDir, f), { force: true });
  }

  const sourcePath = path.join(outDir, "source.mp4");
  ytDlp([
    "-f",
    "bestvideo[height<=720][vcodec^=avc1]+bestaudio/best[height<=720]",
    "--merge-output-format",
    "mp4",
    "-o",
    sourcePath,
    `https://www.youtube.com/watch?v=${youtubeId}`,
  ]);

  // Re-mux video (already H.264) + transcode audio (typically opus) to AAC
  // so the output is HLS-spec compliant. 6 s segments.
  run("ffmpeg", [
    "-y",
    "-i",
    sourcePath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-hls_time",
    "6",
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    path.join(outDir, "segment%03d.ts"),
    "-hls_segment_type",
    "mpegts",
    m3u8,
  ]);

  // The source .mp4 isn't needed at runtime — only the HLS output ships.
  fs.rmSync(sourcePath, { force: true });

  const files = fs.readdirSync(outDir).sort();
  const total = files.reduce((sum, f) => sum + fs.statSync(path.join(outDir, f)).size, 0);
  console.log(`\nWrote ${files.length} files (${total.toLocaleString()} B) to ${outDir}`);
}

main();
