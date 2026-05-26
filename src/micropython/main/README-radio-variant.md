# MicroPython V3 firmware — BLE / radio variants

This directory bundles two MicroPython firmware variants for Calliope mini 3:

| file                      | DEVICE_BLE | MICROBIT_BLE_ENABLED | use case                                                                |
|---------------------------|------------|----------------------|-------------------------------------------------------------------------|
| `calliope-v3.hex`         | 1          | 1                    | **Default.** BLE auto-starts in app mode → widget can re-flash without A+B+Reset. `import radio` panics 071 (radio/SoftDevice conflict). |
| `calliope-v3-radio.hex`   | 1          | 0                    | Used when the user's program contains `import radio` or `from radio import …`. SoftDevice sits dormant in flash, radio peripheral is free for MP. **A+B+Reset still works** — codal's pairing-mode block is compiled in (gated by `DEVICE_BLE`), so the user can BLE-DFU after a button-combo. |

The editor picks between them in [`src/fs/fs.ts`](../../fs/fs.ts) via
`pickRuntimeVariant()` — it greps `main.py` for `import radio` and routes
the build to the matching base.

The widget handles the *runtime swap* transparently via Nordic Secure DFU:
when the device DAL hash and the hex DAL hash don't match (because the
user just added or removed `import radio`), partial-flash throws
`DalMismatchError` → `flashOverBle` falls back to full DFU → new runtime
installed.

## Building the radio variant

Both variants share `FIRMWARE/micropython-calliope-mini-v3` source.
Only **two** local patches are needed for the radio variant — flip the
codal-app BLE auto-start off and bump the version string:

```bash
# (Build dir: ~/mp-build, a WSL-native clone of micropython-calliope-mini-v3
#  on the campus-open branch — building from /mnt/c is ~20× slower.)
cd ~/mp-build

# Patch 1: disable microbit-level BLE manager (don't auto-start at boot)
sed -i 's/"MICROBIT_BLE_ENABLED" : 1/"MICROBIT_BLE_ENABLED" : 0/' \
  src/codal_app/codal.json

# Patch 2: bump MICROBIT_RELEASE so the runtime version string (and
# therefore the DAL hash the widget compares against) diverges from
# the BLE build. Without this the widget would partial-flash the
# user's FS onto the wrong runtime → panic 071 at first import.
sed -i 's/"2.1.2b"/"2.1.2b-radio"/' src/codal_port/mpconfigport.h

# Now build
cd src && rm -rf build codal_port/build && make
cp MINI.hex /mnt/c/GIT/Calliope/LLM/calliope-mini-python-editor/src/micropython/main/calliope-v3-radio.hex

# Revert the patches so the next BLE build still works
cd ~/mp-build
sed -i 's/"MICROBIT_BLE_ENABLED" : 0/"MICROBIT_BLE_ENABLED" : 1/' src/codal_app/codal.json
sed -i 's/"2.1.2b-radio"/"2.1.2b"/' src/codal_port/mpconfigport.h
```

> **Key point:** keep `DEVICE_BLE=1` for both variants. It compiles in
> codal's BLE machinery, *including* the pairing-mode block in
> [`codal-microbit-v2/model/MicroBit.cpp`](../../../../FIRMWARE/codal-microbit-v2/model/MicroBit.cpp#L228-L264)
> that handles A+B-at-boot → `bleManager.init()`. With `DEVICE_BLE=0`
> the entire block compiles out and A+B+Reset just falls through into
> the user program.
>
> `MICROBIT_BLE_ENABLED=0` is independent: it controls whether codal
> calls `bleManager.init()` at *normal* boot. With it off, the
> SoftDevice sits dormant in flash and never claims the radio
> peripheral — MP's `radio` module can use NRF_RADIO directly. The
> SoftDevice only gets enabled when the user A+B+Resets into pairing
> mode.

For a clean two-build CI workflow, copy the two files into per-variant
configs (`codal_app/codal-ble.json`, `codal_app/codal-radio.json`,
etc.) and have `make ble` / `make radio` targets that swap them in
before `make`. The above is a one-shot recipe; nobody's wired up the
proper Makefile targets yet.

## History — earlier broken recipe

An earlier version of this README listed four patches: also
`DEVICE_BLE=0` + a CMakeLists.txt linker override. Those broke
A+B+Reset because `DEVICE_BLE=0` strips out the codal pairing-mode
handler. Verified 2026-05-26 in `calliope-flash-test/open-link-test/`:
the resulting radio hex booted straight into the user program after
A+B+Reset, leaving no way back to BLE-DFU. Current two-patch recipe
restores the original "old python hex" behavior the user remembered
(radio works in app, A+B+Reset enters pairing mode).

## Why we need two variants

The nRF52833 radio peripheral can only be driven by one stack at a time:

- Nordic **SoftDevice** (which provides BLE) takes exclusive ownership of
  the radio when *enabled* (via `sd_softdevice_enable()`, called by
  `bleManager.init()`).
- MicroPython's **`radio` module** uses the radio directly (no
  SoftDevice), conflicting with the SoftDevice's ownership.

If `MICROBIT_BLE_ENABLED=1` the codal app calls `bleManager.init()` at
boot → SoftDevice claims the radio → MP `radio.on()` panics 071.

If `MICROBIT_BLE_ENABLED=0` the SoftDevice is in flash but never
enabled → radio peripheral free → MP `radio.on()` works. A+B+Reset
still enables BLE via the pairing-mode handler (single-shot, no user
code running at that point).

We've tried lazy radio-vs-BLE switching at runtime (see
`project_micropython_ble_radio_runtime_switch` memory — panic 071,
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
