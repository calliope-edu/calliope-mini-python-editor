# Build info: `BUILD.json` and the version line

Every Calliope editor build says which version it is, in the same shape, so
Calliope Campus' version overview (`/admin/versions`) can compare every target
against its channel and a teacher or developer can tell at a glance which build
they are looking at. This editor defines the format; the other editors (Blocks,
KI-Training, Teachable, Snap!, Arcade, UMO) copy it. The plan behind it is
calliope-campus `docs/design/2026-editor-channels.md` ("Version display").

## Channels

| Channel | Built from                           | Build branch | Served at                                    |
| ------- | ------------------------------------ | ------------ | -------------------------------------------- |
| `live`  | a tag `calliope-vX.Y.Z`              | `build-live` | `python.calliope.cc`, Campus pins it         |
| `dev`   | a push to calliope-main              | `build-dev`  | `python-dev.calliope.cc`, campus-dev proxies |
| `local` | `npm start`, a local `npm run build` | none         | your machine                                 |

## `BUILD.json`

Next to every variant of a build: the site root (`/BUILD.json`) and the Campus
variant (`/editors/python/BUILD.json`), with the same values.

```json
{
  "channel": "live",
  "version": "calliope-v1.0.0",
  "commit": "7ea99620f3c4…",
  "builtAt": "2026-11-23T17:00:00Z",
  "ui": null,
  "widget": null,
  "libs": {}
}
```

| Field     | Meaning                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `channel` | `live`, `dev` or `local`.                                                                                               |
| `version` | live: the tag (`calliope-v1.0.0`); dev: the branch (`calliope-main`); local: the checked-out branch.                    |
| `commit`  | The full source commit.                                                                                                 |
| `builtAt` | When it was built, UTC, ISO 8601 without milliseconds.                                                                  |
| `ui`      | calliope-ui's state, `{ "tag": "v0.3.0", "commit": "…" }`; `tag` is `""` on dev. `null` in editors without calliope-ui. |
| `widget`  | The connection widget's state, the same shape as `ui`; `null` in editors without it.                                    |
| `libs`    | Pinned library forks, name → full commit, e.g. `{ "scratch-vm": "9115be5…" }` in Blocks; `{}` where there are none.     |

The Python editor carries neither calliope-ui nor the widget yet (they come
with the prebuilt widget bundle), so `ui` and `widget` are `null`.

The older shape (`name`, `ref`, `source`, `base`, `built`, Blocks also
`scratchVm`) is still on the `build-live` commits Campus pins until the next
tag; Campus' version overview reads both.

## Where the values come from

One script, [`bin/build-info.js`](../bin/build-info.js), turns four
environment variables into this object:

| Variable        | Set by the workflow to                     | Without it (local)                |
| --------------- | ------------------------------------------ | --------------------------------- |
| `BUILD_CHANNEL` | `live` for a tag, `dev` for a branch       | `local`                           |
| `BUILD_VERSION` | the tag or branch name (`github.ref_name`) | `git rev-parse --abbrev-ref HEAD` |
| `BUILD_COMMIT`  | `github.sha`                               | `git rev-parse HEAD`              |
| `BUILD_AT`      | once per job, before both builds           | now                               |

- `craco.config.js` puts the object into `REACT_APP_BUILD_INFO`, which the app
  reads as the constant `buildInfo` ([`src/build-info.ts`](../src/build-info.ts)).
- The `calliope-build` workflow sets the variables once in its step
  "Build info", builds both variants with them and writes
  `node bin/build-info.js` to both `BUILD.json`, so the file and the code
  always agree.

## The version line

One line at the bottom of the help menu (the question mark), below a
separator, black text:

- live: `calliope-v1.0.0 · 7ea9962`
- dev: a framed `dev` mark, then `calliope-main · a1b2c3d`
- local: a framed `local` mark, then the branch and commit

Editors with calliope-ui and the widget add a second line,
`UI v0.3.0 · Widget v0.4.1` on live and `UI 6faa0c1 · Widget 9e8d7c6` on dev;
the Python editor has none. The about dialog's "Editor" row shows the same
version and links to the commit.

## In Campus

The Campus variant (`/editors/python/`, or any page in a frame) logs the build
once to the console at startup:

```
[python-editor] live calliope-v1.0.0 · 7ea9962 {channel: "live", …}
```

Campus itself shows the build in `/admin/versions`, from
`/editors/python/BUILD.json`.

## Copying it to another editor

1. Copy `bin/build-info.js` and fill `ui`, `widget` and `libs` for that editor.
2. Set `BUILD_CHANNEL`, `BUILD_VERSION`, `BUILD_COMMIT` and `BUILD_AT` once per
   build job and write `node bin/build-info.js` as `BUILD.json` next to every
   variant.
3. Compile the same object into the app (an env constant at build time) and
   show the version line in the editor's existing help, settings or about
   menu; log it once in the embedded variant.
