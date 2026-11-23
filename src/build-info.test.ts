/**
 * (c) 2026, Calliope gGmbH and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  BuildInfo,
  logBuildInfoWhenEmbedded,
  packagesLine,
  parseBuildInfo,
  versionLine,
} from "./build-info";

const { buildInfo: fromEnv } = require("../bin/build-info");

const live: BuildInfo = {
  channel: "live",
  version: "calliope-v1.0.0",
  commit: "7ea99620123456789abcdef0123456789abcdef0",
  builtAt: "2026-11-23T17:00:00Z",
  ui: null,
  widget: null,
  libs: {},
};

describe("build info", () => {
  it("names version and short commit", () => {
    expect(versionLine(live)).toEqual("calliope-v1.0.0 · 7ea9962");
    expect(
      versionLine({ ...live, channel: "dev", version: "calliope-main" })
    ).toEqual("calliope-main · 7ea9962");
    expect(versionLine({ ...live, commit: "" })).toEqual("calliope-v1.0.0");
  });

  it("names calliope-ui and widget by tag, on dev by commit", () => {
    expect(packagesLine(live)).toBeNull();
    expect(
      packagesLine({
        ...live,
        ui: { tag: "v0.3.0", commit: "aaaaaaaaaa" },
        widget: { tag: "v0.4.1", commit: "bbbbbbbbbb" },
      })
    ).toEqual("UI v0.3.0 · Widget v0.4.1");
    expect(
      packagesLine({
        ...live,
        ui: { tag: "", commit: "6faa0c1234" },
        widget: { tag: "", commit: "9e8d7c6234" },
      })
    ).toEqual("UI 6faa0c1 · Widget 9e8d7c6");
  });

  it("falls back to local without or with broken build info", () => {
    expect(parseBuildInfo(undefined).channel).toEqual("local");
    expect(parseBuildInfo("{").version).toEqual("local");
    expect(parseBuildInfo(JSON.stringify(live))).toEqual(live);
  });

  it("writes the BUILD.json shape from the workflow's variables", () => {
    expect(
      fromEnv({
        BUILD_CHANNEL: "live",
        BUILD_VERSION: "calliope-v1.0.0",
        BUILD_COMMIT: live.commit,
        BUILD_AT: live.builtAt,
      })
    ).toEqual(live);
    expect(() => fromEnv({ BUILD_CHANNEL: "beta" })).toThrow();
    expect(fromEnv({}).channel).toEqual("local");
  });

  it("logs only in the embedded variant", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => {});
    logBuildInfoWhenEmbedded(live, "", false);
    expect(info).not.toHaveBeenCalled();
    logBuildInfoWhenEmbedded(live, "/editors/python", false);
    logBuildInfoWhenEmbedded(live, "", true);
    expect(info).toHaveBeenCalledTimes(2);
    expect(info.mock.calls[0][0]).toEqual(
      "[python-editor] live calliope-v1.0.0 · 7ea9962"
    );
    info.mockRestore();
  });
});
