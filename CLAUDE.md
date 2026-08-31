# DangerNode

Wire antinode/node danger-zone calculator for end-fed ham antennas (EFHW,
random wire). Offline-first static PWA — no backend, no build step, no
framework. Full design spec lives in [docs/spec.md](docs/spec.md); read that
before making product/scope decisions, it's the source of truth, not this
file.

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
Note: `pota-wire-geometry-calc` has no `js/` folder at all — it's always
been a single `index.html` with zero external script tags. DangerNode
briefly deviated from that (a `js/physics.js` + `js/bands.js` split) and
has since been folded back to match — see the 2026-07-28 entry below for
why that split turned out to be a real-world liability, not just a style
nit. Don't reintroduce a `js/`-file split without solving that problem
first. One deliberate naming divergence: DangerNode's entry file is
`dangernode.html`, not `index.html` — see the 2026-08-31 entry below.

## Current status (as of 2026-07-28)

Core physics module and the full v1 UI are implemented. `dangernode.html`
is a single self-contained file — no `js/` folder, no `<script src>` tags at
all (see the 2026-07-28 entry below). The physics functions (n = L/hw(f)
math, danger-zone classification) and the default US General/Extra band
table are inline `<script>` blocks near the top of the file, both merging
into `window.DN` the same way the UI-support functions further down do.
Exercised by `tests/unit-physics.html` — 27/27 passing, including a
realistic sanity check (68ft EFHW-ish wire: clean on 40m, correctly flags
the classic 20m 2nd-harmonic node).

`dangernode.html` is the full app: EFHW / Random Wire tabs, a Settings tab, the
SVG antinode/node chart, the band verdict table, ft/m unit toggle,
danger-zone tolerance slider, band toggle chips, the Random Wire tab's
informational counterpoise reference (decision 5), a Quick Check panel
(input mode 3), a Suggest Lengths panel (input mode 2 — inverse-solves
`L = n * hw(f)` for a target band/frequency, with a one-click apply), and
localStorage persistence of all state. UI logic lives inline in
`dangernode.html`'s own `<script>` tag, in the same single file as the physics
and band-table code above it; a handful of pure UI-support functions
(`sweepCurve`, `verdictSegments`, `overallVerdict`, `suggestLengths`) are
merged into `window.DN` alongside the physics functions so they're testable
the same way.

Post-playtest revisions (2026-07-16), driven by real usage feedback:
- **Chart curve is now smooth, not sawtooth.** `sweepCurve` used to plot
  `distanceToNearestEven(n)` directly — a triangle wave, which for a wire
  with several half-waves across the HF spectrum rendered as jagged
  zigzags. It now plots `|sin(n*pi/2)|` instead (same 0-at-node/1-at-antinode
  semantics, smooth curve, matches the classic standing-wave-envelope
  picture). Classification math (`distanceToNearestEven`/`classifyDistance`,
  used for verdicts/tables/tolerance) is untouched — only the chart's
  display curve changed.
- **Danger zones are vertical chart shading, not horizontal.** New
  `verdictSegments()` walks a wire's frequency range and returns contiguous
  good/marginal/danger segments. With 1 active wire, drawn as full-height
  background rects. With 2-3 wires (decision 3), full-height rects would
  overlap into noise, so each wire instead gets a thin danger-only tick row
  in its own color along the bottom of the chart.
- **VF is now a global setting, not per-wire** — decision 4 amended, see
  docs/spec.md. A new Settings tab holds one global VF slider+number
  (`#globalVfSlider`/`#globalVfNumber`); wire cards now only have length.
  Every consumer that used to read `w.vf` (chart, table, counterpoise,
  suggest-lengths) now reads `state.globalVf`. `state.view` ('calc' |
  'settings') is separate from `state.tab` ('efhw' | 'random') so switching
  to Settings doesn't lose which calc tab you were on.
- **Slider + number pairing.** Wire length and global VF are each a
  `<input type="range">` paired with a synced `<input type="number">`
  (`.dn-field-paired` CSS) — sliders alone couldn't hit exact values. Quick
  Check already had number-only inputs and is unchanged.

Further revisions (2026-07-28), from a first round of real mobile testing:
- **Band region markers on the chart were nearly invisible** (7% opacity
  fill, 18% opacity border) — fixed by inverting the approach: since these
  rects paint on top of the danger/marginal/good shading, a strong fill
  would wash out that more important signal, so the fill stays minimal and
  the boundary is instead carried by a bright dashed stroke + bold label.
- **Danger-zone tolerance moved from the calc-tab left column into the
  Settings tab**, next to global VF — same `#toleranceSlider`/`#lblTolerance`
  IDs, just relocated markup, no JS binding changes.
- **Y axis relabeled "High Z" / "Low Z"** instead of unitless `0`/`1` ticks
  and a "node/antinode" title — names what the axis means (feedpoint
  impedance character) without implying a real measured value. Chart's
  left margin widened 34→42px so the longer labels don't clip.
- **`index.html` is now a single file with zero `<script src>` tags** —
  the `js/physics.js` + `js/bands.js` split (present since the very first
  commit) turned out to be a real mobile-reliability bug, not just a style
  choice: opening the file via Chrome on Android (via a file manager's
  "open with," which can hand off a `content://` URI instead of a true
  `file://` path) silently failed to load the two sibling `<script src>`
  files. `window.DN` never got populated, the app's own init script threw
  immediately on the first `DN.BANDS`/`DN.hwFt` reference, and the page
  rendered its static shell with *no dynamic values anywhere* — no console
  visible to the user, so it just looked broken with no explanation. Fixed
  by inlining both files' contents directly into `index.html`'s `<script>`
  block (three back-to-back IIFEs: physics, bands, app — same
  `window.DN` merge pattern as before, zero logic changes) and deleting
  the `js/` folder entirely. This also re-aligns with
  `pota-wire-geometry-calc`'s actual convention (see "Sibling project"
  above) and with the original spec's "single HTML/JS bundle" field-
  usability requirement, which the `js/`-file split had quietly drifted
  away from. **Don't split JS into separate files again** without solving
  the mobile file:// problem first — test on an actual phone via a raw
  file open, not just a local `python -m http.server`, before assuming a
  multi-file layout is safe.
- **"Tuner Comfort Zone" radio group added to the Settings tab** (three
  options, next to the tolerance slider): "No tuner (must be resonant)" /
  "Basic tuner" / "Wide-range tuner (G90-class)". These are pure UI
  shortcuts that call the same `setTolerance()` the slider itself uses —
  no new calculation, no change to shading/verdict logic. Current values
  are **placeholder estimates**, explicitly not derived from any
  impedance model (see decision 2 addendum, docs/spec.md) — the user
  plans to cross-check a few lengths against a NanoVNA and their actual
  tuner's match range and report back real numbers.
  `syncTolerancePresetRadios()` keeps the radios in sync in both
  directions: clicking a preset moves the slider, and dragging the
  slider to a value that doesn't exactly match a preset un-checks all
  three (verified via direct DOM manipulation, including a reload to
  confirm the checked state restores correctly from localStorage).
  **Direction bug caught and fixed same day**: the initial mapping
  (No tuner=0.03, Wide-range=0.18) had it backwards. `tolerance` sets the
  radius of the danger zone around each node (`classifyDistance`: `dist <
  tolerance` → danger), so a *larger* tolerance means a *wider* red zone.
  A tuner-less setup can't compensate for any real mismatch, so nearly
  everything except true resonance is risky for it — that's a wide danger
  zone, i.e. a *large* tolerance. A wide-range tuner absorbs most
  mismatches and only fails very close to the actual node — a narrow
  danger zone, i.e. a *small* tolerance. Corrected mapping: No tuner=0.18,
  Basic=0.07 (unchanged), Wide-range=0.03.

Renamed `index.html` → `dangernode.html` (2026-08-31): the generic
filename was a real problem for offline field use — copying multiple
single-page tools onto a phone for zero-connectivity access means several
files all called `index.html` sitting in different folders, which is hard
to tell apart in a phone's file picker/recents view even with folders in
place. Every reference above written before this date still says
`index.html` because that was its name at the time; anything describing
the *current* file uses `dangernode.html`. Test files
(`tests/unit-physics.html`, `tests/system-app.html`) and their iframe
`src` were updated to match — nothing else changed. **This convention
(project-named entry file instead of `index.html`) is intended to apply
to sibling projects too eventually, but that's deferred debt — don't go
rename `pota-wire-geometry-calc/index.html` unless separately asked.**

`tests/system-app.html` (DOM-driving system tests, mirroring the sibling
project's file of the same name) has new tests for the Settings tab and the
paired slider/number inputs, and the old `[data-wire-vf]` references were
fixed to use the new global control. It has still never run to green *inside
this dev environment* — the in-house browser preview tool's iframe
instrumentation reliably hangs/reload-loops when synthetic
click()/dispatchEvent() calls are driven into a nested iframe (re-confirmed
2026-07-16: a plain `navigate` to this file timed out after 300s; not an app
bug — no `location`/`reload` calls anywhere in `index.html`, and
`tests/unit-physics.html`'s iframe, which never dispatches synthetic events,
runs clean every time in the same tool). Expected to run fine in a normal
browser or a plain `python -m http.server`. **If you hit this again, don't
sink time into it** — verify functionally by driving the real `index.html`
directly instead (via a javascript_tool DOM inspection, not click
simulation — this is how the 2026-07-16 fixes above were actually verified:
checked `svg path`/`rect` counts and contents, toggled the Settings tab and
read `style.display`, set `.value` + dispatched `input` on the paired
number/slider inputs and read the other side back, added a wire and
confirmed no stray `vf` key).

**Not yet built**: offline PWA shell (manifest + service worker) — listed
under field-usability requirements in docs/spec.md but out of scope for this
pass, which focused on the UI itself.

## Testing

No build step. Serve the repo root (`python -m http.server`) and open
`tests/unit-physics.html`, or open it directly via `file://` (iframe
same-origin restrictions may bite depending on browser). Results render to
the page; `window.__TEST_SUMMARY__` gives a machine-readable `{total,
passed, failed}` for automated checking. Don't push to GitHub until this is
green — see git log for the standing convention on this project (established
2026-07-09).
