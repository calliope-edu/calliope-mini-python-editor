/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { IntelHexWithId } from "@microbit/microbit-fs";
import { microbitBoardId } from "@microbit/microbit-universal-hex";
import microPythonCalliopeV1V2HexUrl from "./calliope-v1v2.hex";
import microPythonCalliopeV3HexUrl from "./main/calliope-v3.hex";

export const microPythonConfig = {
  versions: [
    {
      name: "MicroPython (Calliope mini V1-V2)",
      url: microPythonCalliopeV1V2HexUrl,
      boardId: microbitBoardId.V1, // 39168 | 0x9900
      version: "1.1.1",
      web: "https://github.com/calliope-edu/micropython-calliope-mini/tree/minidal",
    },
    {
      name: "MicroPython (Calliope mini V3)",
      url: microPythonCalliopeV3HexUrl,
      boardId: microbitBoardId.V2, // 39171 | 0x9903
      version: "2.1.2b+ble",
      web: "https://github.com/calliope-edu/micropython-calliope-mini-v3/tree/campus",
    },
  ],
  // We've previously used this field to allow flags to affect
  // the stubs used and might do so again.
  stubs: "main",
};

const fetchValidText = async (input: RequestInfo) => {
  const response = await fetch(input);
  if (response.status !== 200) {
    throw new Error(
      `Unexpected status: ${response.statusText} ${response.status}`
    );
  }
  return response.text();
};

export type MicroPythonSource = () => Promise<IntelHexWithId[]>;

export const fetchMicroPython: MicroPythonSource = async () =>
  Promise.all(
    microPythonConfig.versions.map(async ({ boardId, url }) => {
      const hex = await fetchValidText(url);
      return { boardId, hex };
    })
  );
