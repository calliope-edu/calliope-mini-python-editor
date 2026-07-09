/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { IntelHexWithId } from "@microbit/microbit-fs";
import { microbitBoardId } from "@microbit/microbit-universal-hex";
import microPythonCalliopeV1V2HexUrl from "./calliope-v1v2.hex";
import microPythonCalliopeV3HexUrl from "./main/calliope-v3.hex";
// The radio variant — currently main's stock micropython-calliope-mini-v3
// build (v2.1.2-cmini3, `MICROBIT_BLE_ENABLED=0`), the same firmware the
// non-campus editors serve. BLE and radio can't coexist on the nRF52 —
// they share the radio HW + SoftDevice slots — so this variant exists so
// MicroPython's `radio` module works; see README for background on why
// pickRuntimeVariant() always selects it.
import microPythonCalliopeV3RadioHexUrl from "./main/calliope-v3-radio.hex";

/**
 * Which MicroPython V3 firmware to flash. See `pickRuntimeVariant`
 * in fs/fs.ts for the selection rule.
 *
 * - 'ble':   BLE on, `import radio` will fail or panic. Default; lets
 *            users flash from the campus widget without bonding and
 *            without pressing A+B+Reset between iterations.
 * - 'radio': BLE off, `radio.send / receive / config` work. Used when
 *            the user's program contains `import radio` (or
 *            `from radio import ...`). After flashing this variant the
 *            device leaves app mode without BLE; the next code change
 *            requires either A+B+Reset (to enter pairing mode + BLE)
 *            or USB.
 */
export type MicroPythonV3Variant = "ble" | "radio";

const v1v2Entry = {
  name: "MicroPython (Calliope mini V1-V2)",
  url: microPythonCalliopeV1V2HexUrl,
  boardId: microbitBoardId.V1, // 39168 | 0x9900
  version: "1.1.1",
  web: "https://github.com/calliope-edu/micropython-calliope-mini/tree/minidal",
};

const v3BleEntry = {
  name: "MicroPython (Calliope mini V3, BLE)",
  url: microPythonCalliopeV3HexUrl,
  boardId: microbitBoardId.V2, // 39171 | 0x9903
  version: "2.1.2b+ble-open",
  variant: "ble" as MicroPythonV3Variant,
  web: "https://github.com/calliope-edu/micropython-calliope-mini-v3/tree/campus-open",
};

const v3RadioEntry = {
  name: "MicroPython (Calliope mini V3, radio)",
  url: microPythonCalliopeV3RadioHexUrl,
  boardId: microbitBoardId.V2, // 39171 | 0x9903 — same board, different runtime
  version: "2.1.2b",
  variant: "radio" as MicroPythonV3Variant,
  web: "https://github.com/calliope-edu/micropython-calliope-mini-v3/tree/oct24-mini3",
};

export const microPythonConfig = {
  // Default `versions` is the BLE variant set. Kept as `versions`
  // (not `versionsBle`) so existing consumers — typings exporters,
  // documentation generators, the e2e harness — keep working without
  // a rename. The radio variant gets selected through
  // `versionsForVariant(...)` below.
  versions: [v1v2Entry, v3BleEntry],
  versionsRadio: [v1v2Entry, v3RadioEntry],
  // We've previously used this field to allow flags to affect
  // the stubs used and might do so again.
  stubs: "main",
};

export function versionsForVariant(variant: MicroPythonV3Variant) {
  return variant === "radio"
    ? microPythonConfig.versionsRadio
    : microPythonConfig.versions;
}

const fetchValidText = async (input: RequestInfo) => {
  const response = await fetch(input);
  if (response.status !== 200) {
    throw new Error(
      `Unexpected status: ${response.statusText} ${response.status}`
    );
  }
  return response.text();
};

/**
 * Source function for MicropythonFsHex. The `variant` parameter
 * defaults to 'ble' for backwards compatibility with existing call
 * sites (e2e tests, storybook). Production code paths pass the
 * variant explicitly — see fs/fs.ts `createInternalFileSystem`.
 */
export type MicroPythonSource = (
  variant?: MicroPythonV3Variant
) => Promise<IntelHexWithId[]>;

export const fetchMicroPython: MicroPythonSource = async (
  variant: MicroPythonV3Variant = "ble"
) =>
  Promise.all(
    versionsForVariant(variant).map(async ({ boardId, url }) => {
      const hex = await fetchValidText(url);
      return { boardId, hex };
    })
  );

/**
 * Detect whether a Python source uses the `radio` module. Picks up
 * the two import forms MicroPython accepts:
 *
 *   import radio
 *   from radio import ...
 *
 * Anything else (string interpolation, dynamic __import__, etc.)
 * isn't catchable statically — but those would never come up in a
 * Blocks / Scratch / introductory-Python context, which is what the
 * campus editor targets.
 *
 * Commented-out imports are ignored (they don't execute), but
 * imports inside `if False:` blocks or unused functions still
 * trigger — MicroPython evaluates the import statement on the
 * line where it appears. Safer to flash radio-variant once than
 * to panic 071 at runtime.
 */
export function detectRadioImport(pythonSource: string): boolean {
  // Strip whole-line comments first so `# import radio` doesn't trip.
  // Doesn't strip end-of-line comments — `import radio  # ...` still matches,
  // which is the right call.
  const withoutComments = pythonSource
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
  return /(^|\n)\s*(?:import\s+radio\b|from\s+radio\s+import)/.test(
    withoutComments
  );
}
