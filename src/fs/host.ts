/**
 * (c) 2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import debounce from "lodash.debounce";
import {
  FileSystem,
  VersionAction,
  EVENT_PROJECT_UPDATED,
  EVENT_TEXT_EDIT,
  MAIN_FILE,
} from "./fs";
import { Logging } from "../logging/logging";
import { BoardId } from "../device/board-id";
import {
  defaultInitialProject,
  PythonProject,
  projectFilesToBase64,
} from "./initial-project";
import { parseMigrationFromUrl } from "./migration";
import {
  FSStorage,
  InMemoryFSStorage,
  SessionStorageFSStorage,
  SplitStrategyStorage,
} from "./storage";

const messages = {
  type: "pyeditor",
  actions: {
    workspacesync: "workspacesync",
    workspacesave: "workspacesave",
    workspaceloaded: "workspaceloaded",
    importproject: "importproject",
    flash: "flash",
    save: "save",
  },
};

/**
 * Parses the `controller` URL parameter as an integer.
 * 0 = standalone, 1 = project sync, 2+ = host owns flash/save/connection.
 */
export const getControllerLevel = (): number => {
  const raw = new URLSearchParams(window.location.search).get("controller");
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
};

/**
 * True when the editor is embedded as an iframe and the host has opted into
 * `controller=2` (host handles flash, save and device connection).
 */
export const isControllerAppMode = (): boolean =>
  window !== window.parent && getControllerLevel() >= 2;

/**
 * Normalise a hardware hint to a micro:bit board id, or null if unrecognised.
 *
 * Calliope Mini 1 & 2 are V1-class silicon (DAL) → micro:bit board id `9900`.
 * Calliope Mini 3 is V2-class (CODAL = micro:bit v2) → `9903`.
 *
 * Accepts the widget's calliope version (`V1`/`V3`), the micro:bit board
 * version (`V2` = Mini 3), the Calliope mini number (`1`/`2`/`3`), or an
 * explicit board id. Note `2` = Calliope Mini 2 (V1-class, 9900) whereas `V2`
 * = micro:bit-class V2 = Mini 3 (9903) — distinct tokens, no collision.
 */
const normalizeBoardHint = (raw: string | null | undefined): "9900" | "9903" | null => {
  if (!raw) return null;
  const hw = String(raw).toLowerCase().trim();
  if (["9900", "v1", "1", "2", "mini1", "mini2", "mini 1", "mini 2"].includes(hw)) return "9900";
  if (["9903", "v2", "v3", "3", "mini3", "mini 3"].includes(hw)) return "9903";
  return null;
};

/**
 * Board version pushed by the host via `postMessage({type:'setBoardVersion',
 * boardVersion})`. Takes precedence over the `hw` URL param because the device
 * is usually connected AFTER the editor iframe loads — a URL param set at load
 * would be stale, and reloading the iframe to change it would reset the editor.
 */
let hostBoardId: "9900" | "9903" | null = null;
if (typeof window !== "undefined" && window !== window.parent) {
  window.addEventListener("message", (e: MessageEvent) => {
    const d = e.data as { type?: string; boardVersion?: string; hw?: string } | null;
    if (d && typeof d === "object" && d.type === "setBoardVersion") {
      const norm = normalizeBoardHint(d.boardVersion ?? d.hw);
      if (norm) hostBoardId = norm;
    }
  });
}

/**
 * The micro:bit board id to build for in controller mode. Prefers a host
 * `setBoardVersion` postMessage, then the `hw` URL param, then defaults to
 * `9903` (Mini 3) so an un-updated host keeps its previous behaviour. Both
 * `9900` and `9903` are registered MicroPython fs sources, so either builds.
 */
export const getControllerBoardIdString = (): "9900" | "9903" => {
  if (hostBoardId) return hostBoardId;
  return normalizeBoardHint(new URLSearchParams(window.location.search).get("hw")) ?? "9903";
};

/**
 * Asks the host (campus) to flash a hex to a connected calliope mini.
 * Only meaningful in `controller >= 2` mode.
 */
export const notifyHostFlash = (name: string, hex: string): void => {
  if (window === window.parent) return;
  window.parent.postMessage(
    {
      type: messages.type,
      action: messages.actions.flash,
      name,
      hex,
    },
    "*"
  );
};

/**
 * Asks the host (campus) to save the hex as a file download.
 * Only meaningful in `controller >= 2` mode.
 */
export const notifyHostSave = (name: string, hex: string): void => {
  if (window === window.parent) return;
  window.parent.postMessage(
    {
      type: messages.type,
      action: messages.actions.save,
      name,
      hex,
    },
    "*"
  );
};

export interface Host {
  createStorage(logging: Logging): FSStorage;
  shouldReinitializeProject(storage: FSStorage): Promise<boolean>;
  createInitialProject(): Promise<PythonProject>;
  notifyReady(fs: FileSystem): void;
}

export class DefaultHost implements Host {
  constructor(private url: string = "") {}

  createStorage(logging: Logging): FSStorage {
    return new SplitStrategyStorage(
      new InMemoryFSStorage(undefined),
      SessionStorageFSStorage.create(),
      logging
    );
  }

  async shouldReinitializeProject(storage: FSStorage): Promise<boolean> {
    const migration = parseMigrationFromUrl(this.url);
    if (migration) {
      return true;
    }
    return !(await storage.exists(MAIN_FILE));
  }

  async createInitialProject(): Promise<PythonProject> {
    const migrationParseResult = parseMigrationFromUrl(this.url);
    if (migrationParseResult) {
      const { migration, postMigrationUrl } = migrationParseResult;
      const project = {
        files: projectFilesToBase64({
          [MAIN_FILE]: migration.source,
        }),
        projectName: migration.meta.name,
      };
      // Remove the migration information from the URL so that a refresh
      // will reload from storage not remigrate.
      window.history.replaceState(null, "", postMigrationUrl);
      return project;
    }
    return defaultInitialProject;
  }
  notifyReady(): void {}
}

export class IframeHost implements Host {
  constructor(
    private parent: Window,
    private window: Window,
    private debounceDelay: number = 1_000
  ) {}
  createStorage(logging: Logging): FSStorage {
    return new InMemoryFSStorage(undefined);
  }
  async shouldReinitializeProject(storage: FSStorage): Promise<boolean> {
    // If there is persistence then it is the embedder's problem.
    return true;
  }
  createInitialProject(): Promise<PythonProject> {
    return new Promise((resolve) => {
      this.window.addEventListener("load", () =>
        notifyWorkspaceSync(this.parent)
      );
      this.window.addEventListener("message", (event) => {
        if (
          event?.data.type === messages.type &&
          event?.data.action === messages.actions.workspacesync
        ) {
          const { data } = event;
          if (!Array.isArray(data.projects)) {
            throw new Error(
              "Invalid 'projects' data type. Array should be provided."
            );
          }
          if (data.projects.length < 1) {
            throw new Error(
              "'projects' array should contain at least one item."
            );
          }
          const incoming = data.projects[0];
          if (typeof incoming === "string") {
            resolve({
              files: projectFilesToBase64({ [MAIN_FILE]: incoming }),
            });
          } else if (incoming && typeof incoming === "object") {
            // A controller (campus) can send a project object. Only trust it if
            // it carries a non-empty `files` map — otherwise downstream code
            // (statistics(), the initial-write loop) dereferences
            // `project.files[MAIN_FILE]` and throws. Fall back to an empty
            // main.py so the editor still initialises instead of crashing on
            // every flash.
            if (incoming.files && typeof incoming.files === "object" &&
                Object.keys(incoming.files).length > 0) {
              resolve(incoming);
            } else {
              resolve({
                files: projectFilesToBase64({ [MAIN_FILE]: "" }),
                projectName: incoming.projectName,
              });
            }
          }
        }
      });
    });
  }
  notifyReady(fs: FileSystem): void {
    const debounceCodeChange = debounce(() => {
      notifyWorkspaceSave(fs, this.parent);
    }, this.debounceDelay);
    fs.addListener(EVENT_PROJECT_UPDATED, debounceCodeChange);
    fs.addListener(EVENT_TEXT_EDIT, debounceCodeChange);

    this.window.addEventListener("message", (event) => {
      if (event?.data.type === messages.type) {
        switch (event.data.action) {
          case messages.actions.importproject:
            return handleImportProject(fs, event.data);
          case messages.actions.flash:
            // Host (campus) asked us to flash the current program (its "Programm
            // übertragen" button). Build the hex and post it back; the host
            // (mini-connection-widget) does the actual flashing.
            return void handleControllerFlashRequest(fs);
          case "serial_data":
          case "serial_reset":
          case "serial_input":
            // Serial transport messages. They belong to the
            // IframeDeviceConnection listener in device/iframe-device.ts,
            // which shares the "pyeditor" message namespace on this window.
            // Not ours — ignore.
            return;
          default:
            // "pyeditor" is a shared message namespace, so an unknown action
            // must never take this listener down. Warn once per action name.
            return warnUnsupportedAction(event.data.action);
        }
      }
    });

    notifyWorkspaceLoaded(this.parent);
  }
}

export const createHost = (logging: Logging): Host => {
  const iframeHost = getControllerHost(logging);
  if (iframeHost) {
    return new IframeHost(iframeHost, window);
  }
  return new DefaultHost(window.location.href);
};

const getControllerHost = (logging: Logging): Window | undefined => {
  const inIframe = window !== window.parent;
  const level = getControllerLevel();
  const iframeControllerMode = inIframe && level >= 1;
  if (iframeControllerMode) {
    if (window.parent) {
      logging.log(`In iframe host mode (controller=${level}).`);
      return window.parent;
    }
    logging.error(
      "Cannot detect valid host controller despite controller URL parameter."
    );
  }
};

/**
 * Host-triggered flash (controller=2). Mirrors `ProjectActions.flash()`'s
 * controller branch: build a single-board Intel HEX for the host-detected board
 * and post it back via `flash`. Best-effort — if the build fails the host simply
 * never receives a hex (the editor's own flash button surfaces build errors in a
 * dialog).
 */
const handleControllerFlashRequest = async (fs: FileSystem) => {
  try {
    const boardId = BoardId.parse(getControllerBoardIdString());
    const hexBytes = await fs.fullFlashData(boardId);
    const hex = new TextDecoder("ascii").decode(hexBytes);
    const project = await fs.getPythonProject();
    notifyHostFlash(project.projectName ?? "main", hex);
  } catch {
    /* swallow — see doc comment */
  }
};

/**
 * Warns (once per action name) about a "pyeditor" action this listener does
 * not handle. Other listeners share the "pyeditor" namespace on the same
 * window (e.g. the device transport in device/iframe-device.ts), so unknown
 * actions are expected and must not throw.
 */
const warnedUnsupportedActions = new Set<string>();
const warnUnsupportedAction = (action: unknown): void => {
  const key = String(action);
  if (warnedUnsupportedActions.has(key)) {
    return;
  }
  warnedUnsupportedActions.add(key);
  console.warn(`Unsupported pyeditor action: ${key}`);
};

/**
 * Host is sending code to update editor.
 */
const handleImportProject = (fs: FileSystem, data: any) => {
  if (!data.project || typeof data.project === "string") {
    fs.write(MAIN_FILE, data.project, VersionAction.INCREMENT);
  }
  if (!data.project || typeof data.project === "object") {
    fs.replaceWithMultipleFiles(data.project);
  }
};

/**
 * Notifies the host we're ready to sync.
 * The host will reply with a `workspacesync`.
 */
const notifyWorkspaceSync = (host: Window) => {
  host.postMessage(
    {
      type: messages.type,
      action: messages.actions.workspacesync,
    },
    "*"
  );
};

/**
 * Notifies the host that 'workspacesync' was successful.
 */
const notifyWorkspaceLoaded = (host: Window) => {
  host.postMessage(
    {
      type: messages.type,
      action: messages.actions.workspaceloaded,
    },
    "*"
  );
};

/**
 * Sends the editor code to the host.
 *
 * We do this periodically when the code changes.
 */
const notifyWorkspaceSave = async (fs: FileSystem, host: Window) => {
  const project = await fs.getPythonProject();
  host.postMessage(
    {
      type: messages.type,
      action: messages.actions.workspacesave,
      project,
    },
    "*"
  );
};
