# DangerNode

Wire antinode/node danger-zone calculator for **end-fed random wires** (EFRW).
It shows which wire lengths put a **half-wave multiple** (high feedpoint Z — hard
to tune) inside the bands you plan to work, so you can avoid them. Offline-first
static page — no backend, no build step, no framework. Full design spec lives
in [docs/spec.md](docs/spec.md); read that before making product/scope
decisions, it's the source of truth, not this file.

## The model in one paragraph (don't re-invert this)

`n = L / hw(f)`, `hw = 492·VF/f`. The wire's far end is open (voltage
antinode). **Every integer n** — odd *and* even — puts the feedpoint on a
voltage antinode: high Z, the **danger node**. **Half-integer n** (odd
quarter-waves) is high-current / low-Z: the good place to be. Danger = distance
to the nearest *integer* < tolerance; the max possible distance is 0.5. An
earlier version had even/odd backwards (the center-fed dipole mapping) and
flagged the 2nd harmonic of a 68 ft wire on 20m as bad. If a "sanity check"
ever makes an EFHW-style harmonic look like a node *to be avoided in error*,
re-read this paragraph — and note an EFHW sits *on* these nodes by design
(that's why it needs a 49:1 transformer); this tool is for avoiding them.

## Sibling project

`../pota-wire-geometry-calc` is the same author's other antenna tool.
DangerNode intentionally matches its conventions:
- Vanilla HTML/CSS/JS, no dependencies
- Dark khaki/amber "field gear" visual theme (CSS custom properties in
  `dangernode.html`: `--bg`, `--khaki`, `--amber`, `--green-signal`,
  `--red-warn`)
- Pure functions exposed on a `window` namespace inside `dangernode.html`
  (`window.DN` here, `window.WGC` there) so unit tests can load the real
  `dangernode.html` via a hidden iframe instead of keeping a parallel copy
  of the logic that can drift out of sync
- `tests/harness.js` is copied verbatim from that repo — same
  zero-dependency `suite()`/`test()`/`assert` pattern

When in doubt about a convention (file layout, test structure, naming), check
how the sibling project does it first rather than inventing a new pattern.
The entry file is `dangernode.html`, not `index.html` (a phone's file picker
can't tell several `index.html`s apart). Applying that to the sibling is
deferred debt — don't rename `pota-wire-geometry-calc/index.html` unless
separately asked.

## Hard rules

- **One self-contained file. No `js/` folder, no `<script src>`, no external
  `<link>`.** A `js/physics.js` + `js/bands.js` split once silently failed to
  load when Chrome on Android opened the file via a file manager (`content://`
  URI instead of `file://`): `window.DN` never populated, the init script threw,
  and the page rendered its static shell with no values and no visible error.
  Don't split files again without testing a raw phone file-open, not just
  `python -m http.server`.
- **No network dependencies.** Fonts are embedded (below). Don't add a CDN
  link, Google Fonts `<link>`, analytics, etc.
- **Never rewrite a number input while the user is typing in it.** Use
  `bindNumberInput` (flag invalid, leave state alone, snap back on `change`).
  An earlier build clamped + re-set the field on every keystroke so typing
  "120" became 5.00 and VF "0.97" became 0.82.
- **Validate everything read from localStorage per field** (`loadState`). A bad
  value must fall back to that field's default, never throw during init.
- Don't push until both test files are green (see Testing).

## Current status (as of 2026-11-07, v0.2.2 build 7)

Implemented, single file `dangernode.html`:
- One **Calculator** view plus a **Settings** view (the old EFHW / Random Wire
  tabs were merged — an EFHW is just a wire that's a half-wave multiple on its
  lowest band).
- **Chart is one continuous sweep from 1 MHz to 2 MHz above the highest selected
  band** (`DN.chartRange`; all bands → 1–31.7, 160m+80m → 1–6) so the whole
  length's pattern is visible at once, with selected bands outlined (bright
  dashed stroke, 4px min width, name label above the plot). Gridline step is
  chosen to keep ≤~10 labels. Smooth `|cos(nπ)|` envelope (High Z at integer n),
  red/amber vertical shading; with 2–3 wires the shading becomes a thin per-wire
  danger tick row instead. **Don't split it into per-band panels again** — tried
  2026-11-07 and reverted: each band was legible but the whole-length
  relationships were lost. Trimming the axis top to the highest band is fine.
- **"Show half-wave multiples" checkbox** (default on): dashed line at each
  `f = k·492·VF/L` across the whole axis (labeled `n=k` for one wire).
- Band verdict table, ft/m toggle, 1–3 comparison wires (slider + number box
  each), band chips, tolerance slider (0.01–0.20) + "Tuner Comfort Zone" presets
  (0.15 / 0.07 / 0.03 — **placeholder estimates**, not derived from any
  impedance model; the author plans to replace them with NanoVNA-measured
  values), global VF in Settings (Quick Check follows it), Quick Check,
  Suggest Lengths (single-frequency solve for half-integer n; "Apply" loads
  wire 1), counterpoise reference (informational, always shown),
  localStorage persistence (key `dangernode-state-v2`).
- Out-of-range / unparseable entries in any number field are flagged red and
  ignored (results show a hint or "—", never `Infinity`/`NaN`/negative lengths).
- IBM Plex embedded as base64 woff2 (see below) — zero requests, verified.

**Not built**: offline PWA shell (manifest + service worker). Note service
workers only run over https/localhost, **not** `file://` / `content://`, so the
PWA path means hosting (e.g. GitHub Pages) and is separate from the "copy one
file to the phone" path. Also known gaps: much text is 9–12px dim khaki (weak for
direct sunlight, and iOS zooms inputs under 16px); Suggest Lengths solves one
frequency, not a whole band; a scan-all-lengths ranking across selected bands is
the obvious next feature.

## Embedded fonts — how to regenerate

`<style id="dnFonts">` at the top of `dangernode.html` holds five Latin-subset
woff2 faces as base64: IBM Plex Mono 400/600, IBM Plex Sans 400, IBM Plex Sans
Condensed 600/700 (those are exactly the weights the CSS uses; add one only if
you use it). Source: `@fontsource/ibm-plex-{mono,sans,sans-condensed}@5.3.0`,
`files/<name>-latin-<weight>-normal.woff2` (SIL OFL 1.1). To rebuild: `npm i`
those packages in a scratch dir, base64 each file, emit
`@font-face{font-family:'…';font-weight:…;src:url(data:font/woff2;base64,…) format('woff2')}`.
✓ ▲ ✕ glyphs aren't in Plex and fall back to system fonts (fine).

## Testing

No build step. Serve the repo root (`python -m http.server`) and open
`tests/unit-physics.html` (46 tests: the math) and `tests/system-app.html`
(42 tests: drives the real DOM in an iframe — typing keystroke-by-keystroke,
chips, wires, persistence, corrupt state, no-external-requests). Results render
to the page; `window.__TEST_SUMMARY__` is `{total, passed, failed}` for
automation (e.g. Playwright `waitForFunction`). Both are green as of 2026-11-07.

**The system test used to "hang" and was blamed on the preview tool — it was a
real test bug.** The page's iframe `load` handler fired again on every
`location.reload()` inside the persistence tests, wiping storage and re-running
the whole suite forever. It's now `{ once: true }`; keep it that way.

Test helper to remember: `typeInto(el, '120')` dispatches one `input` event per
prefix, like a real user. Setting `.value = '120'` in one shot hides
keystroke-order bugs. (Typing "300" also passes through a valid "30", so use a
single-shot value to test out-of-range paste.)

## History worth remembering

- 2026-07-09: don't push to GitHub until tests are green (standing convention).
- 2026-07-16: chart curve made smooth (display-only) while classification kept
  on the distance metric; VF made global (decision 4, spec); slider + number
  pairing.
- 2026-07-28: `js/` split folded into one file (mobile `content://` failure);
  tolerance moved to Settings; Y axis labeled High Z / Low Z; Tuner Comfort Zone
  presets added (direction bug caught: larger tolerance = wider red zone = what
  a tuner-less setup needs).
- 2026-08-31: `index.html` → `dangernode.html`.
- 2026-11-07: **physics polarity flipped** (integer n = danger; see top), EFHW
  tab dropped, half-wave markers added (a per-band-panel chart was tried and
  reverted the same day; axis then trimmed to 1 MHz .. highest selected band + 2
  MHz), fonts
  embedded, input-entry/validation bugs fixed, tolerance range and presets
  rescaled for the 0–0.5 metric, Quick Check VF made global, storage key bumped
  to `-v2` (old saves ignored), system tests now run and pass.
