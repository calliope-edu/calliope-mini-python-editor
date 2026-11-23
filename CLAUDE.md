# CLAUDE.md

Calliope's fork of the micro:bit Python Editor V3 (React, Create React App via
craco). It runs on its own at python.calliope.cc and inside Calliope Campus at
`/editors/python/` (README, "Controller mode").

## Branches

- Work on `calliope-main`: branch off it and merge back into it. `main` and
  the older branches (`tested-bootloader`, `campus*`, …) are history.
- A tag `calliope-vX.Y.Z` on `calliope-main` goes live: the `calliope-build`
  workflow builds it onto `build-live` (python.calliope.cc; Campus pins it).
  Every push to `calliope-main` builds onto `build-dev`
  (python-dev.calliope.cc, campus-dev).
- Never commit to `build-live` or `build-dev` by hand; only the workflow
  writes them, and they only ever grow (Campus release tags pin old commits).

## Version

- `BUILD.json` and the help menu's version line follow docs/build-info.md,
  the format the other Calliope editors copy. Change the format there first.

## Running it

- `npm ci --ignore-scripts && npx patch-package` installs without puppeteer's
  Chromium download; `npm start` serves on port 3000 (`PORT=…` for another,
  `BROWSER=none` to not open a browser).
- Unit tests: `CI=true npm test -- --watchAll=false`; types: `npm run typecheck`.
