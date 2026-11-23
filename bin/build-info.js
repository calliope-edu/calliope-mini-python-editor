#!/usr/bin/env node
/**
 * (c) 2026, Calliope gGmbH and contributors
 *
 * SPDX-License-Identifier: MIT
 */
// The build's version as BUILD.json holds it (docs/build-info.md).
//
// The calliope-build workflow sets BUILD_CHANNEL, BUILD_VERSION, BUILD_COMMIT
// and BUILD_AT once per job; craco.config.js turns the same values into the
// REACT_APP_BUILD_INFO constant both builds compile in, and the workflow writes
// BUILD.json next to each build with `node bin/build-info.js`. Without those
// variables (a local `npm start` or `npm run build`) the channel is "local" and
// version and commit come from git.
//
// Other editors copy this script and change only `ui`, `widget` and `libs`.
const { execSync } = require("child_process");

const CHANNELS = ["live", "dev", "local"];

const git = (args) => {
  try {
    return execSync(`git ${args}`, {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
};

/**
 * @param {Record<string, string | undefined>} env
 */
const buildInfo = (env = process.env) => {
  const channel = env.BUILD_CHANNEL || "local";
  if (!CHANNELS.includes(channel)) {
    throw new Error(
      `BUILD_CHANNEL must be one of ${CHANNELS.join(", ")}, not "${channel}"`
    );
  }
  return {
    channel,
    // live: the tag (calliope-vX.Y.Z); dev: the branch (calliope-main).
    version: env.BUILD_VERSION || git("rev-parse --abbrev-ref HEAD") || "local",
    commit: env.BUILD_COMMIT || git("rev-parse HEAD"),
    builtAt: env.BUILD_AT || new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    // The Python editor carries neither calliope-ui nor the connection widget
    // yet; editors that do give { tag, commit } here (tag "" on dev).
    ui: null,
    widget: null,
    // Pinned library forks, name → commit (Blocks: "scratch-vm").
    libs: {},
  };
};

module.exports = { buildInfo };

if (require.main === module) {
  process.stdout.write(JSON.stringify(buildInfo(), null, 2) + "\n");
}
