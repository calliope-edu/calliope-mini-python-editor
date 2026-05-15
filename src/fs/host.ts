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
          if (typeof data.projects[0] === "string") {
            resolve({
              files: projectFilesToBase64({ [MAIN_FILE]: data.projects[0] }),
            });
          }
          if (typeof data.projects[0] === "object") {
            resolve(data.projects[0]);
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
          default:
            throw new Error(`Unsupported action: ${event.data.action}`);
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
