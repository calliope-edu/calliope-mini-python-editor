# micro:bit Python Editor V3

This project is a web-based code editor that targets the [MicroPython](https://micropython.org) version of the [Python programming language](http://python.org/).

Code written with this editor is expected to run on the [BBC micro:bit device](https://microbit.org).

Try it out at https://python.microbit.org/

<figure>
  <img src="https://user-images.githubusercontent.com/44397098/193227581-58d86d58-d679-4244-ac80-2282007a20b9.png" alt="Screenshot of the Python editor showing the code editing area, Reference documentation and micro:bit simulator" width="100%">
  <figcaption>The image shows the micro:bit-branded deployment</figcaption>  
</figure>

## Calliope fork — self-contained build

This fork bundles everything the editor needs so a deploy is just
`npm ci && npm run build`. No auth-gated package installs, no external
CMS at runtime, no `REACT_APP_STAGE` / `NODE_AUTH_TOKEN` env vars,
no `.npmrc`. Suitable for Cloudflare Pages out of the box.

### What's vendored

| Asset | Lives at | Refresh with |
|---|---|---|
| Branding (logos, Chakra theme, colors) | [`src/deployment/calliope/`](src/deployment/calliope/) | Source-copy from `calliope-edu/calliope-theme`; set `THEME=default` to swap back to upstream branding |
| Documentation JSON (Explore, Reference, Ideas, mapping, editor-config) | [`src/documentation/cms-snapshot/`](src/documentation/cms-snapshot/) | `node bin/extract-cms.js` |
| Documentation images | [`public/cms/images/`](public/cms/images/) | `node bin/extract-cms-images.js` |
| Welcome video (HLS, played via [`hls.js`](https://github.com/video-dev/hls.js)) | [`public/cms/videos/welcome/`](public/cms/videos/welcome/) | `node bin/extract-cms-video.js <youtubeId> welcome` (needs `ffmpeg` + `yt-dlp`) |
| MicroPython simulator (committed prebuilt) | [`public/simulator/`](public/simulator/) | `bin/build-simulator.sh` (needs Emscripten) |
| MicroPython simulator source | [`simulator-src/`](simulator-src/) (git submodule of [`calliope-edu/micropython-simulator`](https://github.com/calliope-edu/micropython-simulator)) | `git submodule update --recursive --remote simulator-src` |

The Sanity Studio at project `hmru2910` stays the editorial source. The
runtime never talks to Sanity — content changes go via the extractor
scripts and a commit.

### Controller mode (campus integration)

When loaded with `?controller=2`, the editor delegates flashing, saving
and device connection to the parent window via `postMessage` — used by
[`calliope-campus`](https://github.com/calliope-edu/calliope-campus)
when embedding the editor in an iframe. Project sync (`?controller=1`)
is unchanged and remains backward-compatible.

Protocol (all messages are `{type: "pyeditor", action, ...}`):

- Editor → host: `workspacesync`, `workspaceloaded`, `workspacesave`,
  `flash {name, hex}` *(controller>=2)*, `save {name, hex}` *(controller>=2)*
- Host → editor: `workspacesync {projects}`, `importproject {project}`

In `controller=2` the project-name UI, the WebUSB connect/disconnect
menu and the browser-download save path are hidden — the campus owns
those flows via `mini-connection-widget`. See [`src/fs/host.ts`](src/fs/host.ts)
and [`src/project/project-actions.tsx`](src/project/project-actions.tsx).

### Cloning for development

```bash
git clone https://github.com/calliope-edu/calliope-mini-python-editor.git
cd calliope-mini-python-editor
npm ci
npm start
```

The simulator submodule is **not** required for `npm run build` — the
committed prebuilt under `public/simulator/` is what ships. Only init
it when changing simulator source:

```bash
git submodule update --init --recursive simulator-src
source ~/.emsdk/emsdk_env.sh   # see bin/build-simulator.sh for setup
bin/build-simulator.sh
git add simulator-src public/simulator/
```

### Refreshing CMS content

```bash
node bin/extract-cms.js          # ideas / reference / mapping / editor-config JSON
node bin/extract-cms-images.js   # images referenced by the snapshots
git add bin/ src/documentation/cms-snapshot/ public/cms/images/
git commit -m "Refresh CMS snapshot"
```

Adding a new deployment origin (e.g. a Cloudflare preview branch) no
longer requires touching Sanity CORS settings.

## Previous versions

For more background about how this editor relates to the original Python Editor project, see [this explanation](https://github.com/bbcmicrobit/PythonEditor/issues/391).

The V2 editor project is still available at https://python.microbit.org/v/2 and its source code can be found in GitHub at https://github.com/bbcmicrobit/PythonEditor.

## Building and running the editor

We've written a [technical overview](./docs/tech-overview.md) that's a good starting point for working on the Python Editor or for using ideas and components from the app in other projects. We'd love to hear from you if you're making use of this project. You can get in touch via [support](https://support.microbit.org/).

Getting up and running:

1. Ensure you have a working [Node.js environment](https://nodejs.org/en/download/). We recommend using the LTS version of Node and NPM version 8 or newer.
2. Checkout this repository with Git. GitHub have some [learning resources for Git](https://docs.github.com/en/get-started/quickstart/git-and-github-learning-resources) that you may find useful.
3. Install the dependencies by running `npm install` on the command line in the checkout folder.
4. Choose from the NPM scripts documented below. Try `npm start` if you're not sure.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

If you have a connected micro:bit device, then setting the environment variable `TEST_MODE_DEVICE=1` will enable additional tests that will connect to your micro:bit. The tests will overwrite programs and data on the micro:bit.

### `npm run test:e2e`

Launches the test runner in the interactive watch mode running the end to end tests.

These are excluded from the normal test run.

The tests expect the app to already be running on http://localhost:3000, for example via `npm start`.

We use [Puppeteer](https://pptr.dev/) and the helpers provided by [Testing Library](https://testing-library.com/docs/pptr-testing-library/intro/).

The CI tests run these end-to-end tests against a production build.

### `npm run test:all --testPathPattern autocomplete`

An example of how to use jest options to filter to a specific subset of the tests (e2e or unit).

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Deployments

Most users should use the supported Foundation deployment at https://python.microbit.org/

The editor is deployed by [CircleCI](https://circleci.com/gh/microbit-foundation/python-editor-v3).

The `main` branch is deployed to https://python.microbit.org/v/beta on each push.

Other branches (e.g. for PRs) are deployed to https://review-python-editor-v3.microbit.org/{branch}. Special characters in the branch name are replaced by hyphens.

## License

This software is under the MIT open source license.

[SPDX-License-Identifier: MIT](LICENSE)

Binaries for MicroPython are included for micro:bit V1 ([license](https://github.com/bbcmicrobit/micropython/blob/master/LICENSE)) and micro:bit V2 ([license](https://github.com/microbit-foundation/micropython-microbit-v2/blob/master/LICENSE)). Both are MIT licensed.

Python diagnostics and autocomplete use a fork of Microsoft's Pyright type checker which has been [modified by us](public/workers/PYRIGHT_README.txt) to run as a Web Worker. Pyright is © Microsoft Corporation and [used under an MIT license](public/workers/PYRIGHT_LICENSE.txt).

We use dependencies via the NPM registry as specified by the package.json file under common Open Source licenses.

Full details of each package can be found by running `license-checker`:

```bash
$ npx license-checker --direct --summary --production
```

Omit the flags as desired to obtain more detail.

## Code of Conduct

Trust, partnership, simplicity and passion are our core values we live and
breathe in our daily work life and within our projects. Our open-source
projects are no exception. We have an active community which spans the globe
and we welcome and encourage participation and contributions to our projects
by everyone. We work to foster a positive, open, inclusive and supportive
environment and trust that our community respects the micro:bit code of
conduct. Please see our [code of conduct](https://microbit.org/safeguarding/)
which outlines our expectations for all those that participate in our
community and details on how to report any concerns and what would happen
should breaches occur.
