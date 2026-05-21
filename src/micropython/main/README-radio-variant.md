# MicroPython V3 firmware — BLE / radio variants

This directory bundles two MicroPython firmware variants for Calliope mini 3:

| file                      | DEVICE_BLE | MICROBIT_BLE_ENABLED | use case                                                                |
|---------------------------|------------|----------------------|-------------------------------------------------------------------------|
| `calliope-v3.hex`         | 1          | 1                    | **Default.** BLE on, `import radio` will panic 071 (radio/SoftDevice conflict). Flash from campus widget works repeatedly without A+B+Reset. |
| `calliope-v3-radio.hex`   | 0          | 0                    | Used when the user's program contains `import radio` or `from radio import …`. BLE off → next flash needs USB or A+B+Reset to enter pairing mode. |

The editor picks between them in [`src/fs/fs.ts`](../../fs/fs.ts) via
`pickRuntimeVariant()` — it greps `main.py` for `import radio` and routes
the build to the matching base.

The widget handles the *runtime swap* transparently via Nordic Secure DFU:
when the device DAL hash and the hex DAL hash don't match (because the
user just added or removed `import radio`), partial-flash throws
`DalMismatchError` → `flashOverBle` falls back to full DFU → new runtime
installed.

## Building the radio variant

Both variants share `FIRMWARE/micropython-calliope-mini-v3` source. The
radio variant needs **four small local patches** to the build setup:

```bash
# (Build dir: ~/mp-build, a WSL-native clone of micropython-calliope-mini-v3
#  on the campus-open branch — building from /mnt/c is ~20× slower.)
cd ~/mp-build

# Patch 1: disable codal-level BLE
sed -i 's/"DEVICE_BLE": 1/"DEVICE_BLE": 0/' \
  lib/codal/libraries/codal-microbit-v2/target-locked.json

# Patch 2: disable microbit-level BLE manager
sed -i 's/"MICROBIT_BLE_ENABLED" : 1/"MICROBIT_BLE_ENABLED" : 0/' \
  src/codal_app/codal.json

# Patch 3: bump MICROBIT_RELEASE so the runtime version string (and
# therefore the DAL hash the widget compares against) diverges from
# the BLE build. Without this the widget would partial-flash the
# user's FS onto the wrong runtime → panic 071 at first import.
sed -i 's/"2.1.2b"/"2.1.2b-radio"/' src/codal_port/mpconfigport.h

# Patch 4: keep the softdevice.ld linker layout (app at 0x1c000) even
# when DEVICE_BLE=0. The stock codal CMakeLists.txt switches to
# nrf52833.ld for non-BLE builds, which places the app at 0x0 —
# fine for non-bootloader Lancaster builds, but the Calliope mini 3
# v0.3.5-campus-open-1 bootloader expects the app at 0x1c000 and
# refuses to boot one at 0x0.
sed -i 's|ld/nrf52833\.ld|ld/nrf52833-softdevice.ld|g' \
  lib/codal/libraries/codal-microbit-v2/CMakeLists.txt

# Now build
cd src && rm -rf build codal_port/build && make
cp MINI.hex /mnt/c/GIT/Calliope/LLM/calliope-mini-python-editor/src/micropython/main/calliope-v3-radio.hex

# Revert the four patches so the next BLE build still works
cd ~/mp-build
sed -i 's/"DEVICE_BLE": 0/"DEVICE_BLE": 1/' lib/codal/libraries/codal-microbit-v2/target-locked.json
sed -i 's/"MICROBIT_BLE_ENABLED" : 0/"MICROBIT_BLE_ENABLED" : 1/' src/codal_app/codal.json
sed -i 's/"2.1.2b-radio"/"2.1.2b"/' src/codal_port/mpconfigport.h
git -C lib/codal/libraries/codal-microbit-v2 checkout CMakeLists.txt
```

`addlayouttable.py` already handles a missing SoftDevice region —
that fix is in micropython-calliope-mini-v3/src on the `campus-open`
branch (`a8700d0`).

For a clean two-build CI workflow, copy the four files into per-variant
configs (`codal_app/codal-ble.json`, `codal_app/codal-radio.json`,
etc.) and have `make ble` / `make radio` targets that swap them in
before `make`. The above is a one-shot recipe; nobody's wired up the
proper Makefile targets yet.

## Current state

`calliope-v3-radio.hex` is currently a **placeholder** — bit-for-bit
identical to `calliope-v3.hex`. The editor's variant selection logic
is wired up correctly; replacing this file with the actual radio
build is the one remaining step. Until then, programs that do
`import radio` will still hit panic 071 at runtime — same as today,
no regression.

## Why we need two variants

The nRF52833 radio peripheral can only be driven by one stack at a time:

- Nordic **SoftDevice** (which provides BLE) takes exclusive ownership of
  the radio when BLE is active.
- MicroPython's **`radio` module** uses the radio directly (no
  SoftDevice), conflicting with the SoftDevice's ownership.

We've tried lazy radio-vs-BLE switching at runtime (see
`project_micropython_ble_radio_runtime_switch` memory note — panic 071,
needs JTAG to diagnose). Easier to just ship two firmwares and pick the
right one based on the user's code.

## Detection rules

`detectRadioImport()` in [`micropython.ts`](../micropython.ts) catches:

- `import radio`
- `from radio import …` (any imported name)
- Same patterns on lines after `try:` or other indented blocks
- **Not** caught: dynamic `__import__("radio")`, eval-based imports,
  imports inside comments

If you ever extend the editor to allow user-installed modules that
indirectly import `radio`, expand the detector.
