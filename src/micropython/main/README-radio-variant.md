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

Both variants share `FIRMWARE/micropython-calliope-mini-v3` source. Only
the codal config differs.

```bash
# 1. Default build (BLE variant)
cd FIRMWARE/micropython-calliope-mini-v3/src
make clean
make                                                    # → src/MINI.hex (BLE variant)
cp src/MINI.hex calliope-mini-python-editor/src/micropython/main/calliope-v3.hex

# 2. Radio variant — flip the BLE flags in codal_app/codal.json and
#    target-locked.json:
#    codal_app/codal.json  : "MICROBIT_BLE_ENABLED": 0  (already is)
#    target-locked.json    : "DEVICE_BLE": 0            (currently 1)
#    Also set a different CODAL_APP_VERSION / version string so the
#    DAL hash diverges from the BLE build — otherwise the widget
#    thinks they're the same runtime and partial-flashes user code
#    onto the wrong runtime (panic 071).
make clean
make                                                    # → src/MINI.hex (radio variant)
cp src/MINI.hex calliope-mini-python-editor/src/micropython/main/calliope-v3-radio.hex
```

For a clean two-build workflow, copy `codal_app/codal.json` to
`codal_app/codal-radio.json` and have a `make radio` Makefile target
that swaps it in before `cmake`.

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
