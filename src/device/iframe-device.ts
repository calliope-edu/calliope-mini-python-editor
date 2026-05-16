/**
 * (c) 2026, Calliope gGmbH.
 *
 * SPDX-License-Identifier: MIT
 *
 * DeviceConnection that relays serial + flash through iframe postMessages
 * to the parent window. Used when the editor runs embedded in
 * calliope-campus with `?controller=2`: the campus owns the real USB/BLE
 * link via mini-connection-widget; this class is just a transport-shaped
 * proxy so the editor's xterm / project-actions don't need to care.
 *
 * Message protocol (all `{type: "pyeditor", action, ...}`):
 *   editor -> campus:  serial_input { data: string }
 *                      flash       { name, hex }   (sent from project-actions)
 *                      save        { name, hex }   (sent from project-actions)
 *   campus -> editor:  serial_data  { data: string }
 *                      serial_reset
 */

import EventEmitter from "events";
import {
  ConnectionStatus,
  DeviceConnection,
  EVENT_SERIAL_DATA,
  EVENT_SERIAL_RESET,
  EVENT_STATUS,
  FlashDataSource,
} from "./device";

interface IncomingMessage {
  type?: string;
  action?: string;
  data?: string;
}

export class IframeDeviceConnection
  extends EventEmitter
  implements DeviceConnection
{
  // The campus only embeds us when it has a device to talk to. We claim
  // CONNECTED so the editor UI behaves accordingly (serial pane mounts,
  // Send button doesn't gate on a connect step).
  status: ConnectionStatus = ConnectionStatus.CONNECTED;

  private listener = (event: MessageEvent) => {
    const data = event.data as IncomingMessage | null;
    if (!data || data.type !== "pyeditor") return;
    switch (data.action) {
      case "serial_data":
        if (typeof data.data === "string" && data.data.length > 0) {
          this.emit(EVENT_SERIAL_DATA, data.data);
        }
        break;
      case "serial_reset":
        this.emit(EVENT_SERIAL_RESET, {});
        break;
    }
  };

  async initialize(): Promise<void> {
    window.addEventListener("message", this.listener);
    this.emit(EVENT_STATUS, this.status);
  }

  dispose() {
    window.removeEventListener("message", this.listener);
    this.removeAllListeners();
  }

  async connect(): Promise<ConnectionStatus> {
    return this.status;
  }

  async disconnect(): Promise<void> {
    // The campus owns the connection lifecycle. No-op so callers that try
    // to disconnect (e.g. before a flash) don't error.
  }

  async flash(
    _dataSource: FlashDataSource,
    options: {
      partial: boolean;
      progress: (percentage: number | undefined, partial: boolean) => void;
    }
  ): Promise<void> {
    // project-actions intercepts flash() in controller=2 mode and posts the
    // hex itself, so this is normally unreachable. Implemented as a no-op
    // that completes the progress callback so any path that does call us
    // doesn't hang.
    options.progress(undefined, options.partial);
  }

  async serialWrite(data: string): Promise<void> {
    if (window === window.parent) return;
    window.parent.postMessage(
      { type: "pyeditor", action: "serial_input", data },
      "*"
    );
  }

  clearDevice(): void {
    // No-op: the campus owns device selection.
  }
}
