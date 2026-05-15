/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

export class NullLogging {
  event(_event: any): void {}
  error(_e: any): void {}
  log(_e: any): void {}
}
