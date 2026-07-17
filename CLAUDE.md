# DangerNode

Wire antinode/node danger-zone calculator for end-fed ham antennas (EFHW,
random wire). Offline-first static PWA — no backend, no build step, no
framework. Full design spec lives in [docs/spec.md](docs/spec.md); read that
before making product/scope decisions, it's the source of truth, not this
file.

## Sibling project

`../pota-wire-geometry-calc` is the same author's other antenna tool.
DangerNode intentionally matches its conventions:
- Vanilla HTML/CSS/JS, single-file-per-concern, no dependencies
- Dark khaki/amber "field gear" visual theme (CSS custom properties in
  `index.html`: `--bg`, `--khaki`, `--amber`, `--green-signal`, `--red-warn`)
- Pure functions exposed on a `window` namespace inside `index.html`
  (`window.DN` here, `window.WGC` there) so unit tests can load the real
  `index.html` via a hidden iframe instead of keeping a parallel copy of the
  logic that can drift out of sync
- `tests/harness.js` is copied verbatim from that repo — same
  zero-dependency `suite()`/`test()`/`assert` pattern

When in doubt about a convention (file layout, test structure, naming), check
how the sibling project does it first rather than inventing a new pattern.

## Current status (as of 2026-07-16)

Core physics module and the full v1 UI are implemented. `js/physics.js`
(n = L/hw(f) math, danger-zone classification) and `js/bands.js` (default US
General/Extra band table) are exercised by `tests/unit-physics.html` —
27/27 passing, including a realistic sanity check (68ft EFHW-ish wire: clean
on 40m, correctly flags the classic 20m 2nd-harmonic node).

`index.html` is the full app: EFHW / Random Wire tabs, a Settings tab, the
SVG antinode/node chart, the band verdict table, ft/m unit toggle,
danger-zone tolerance slider, band toggle chips, the Random Wire tab's
informational counterpoise reference (decision 5), a Quick Check panel
(input mode 3), a Suggest Lengths panel (input mode 2 — inverse-solves
`L = n * hw(f)` for a target band/frequency, with a one-click apply), and
localStorage persistence of all state. UI logic lives inline in
`index.html`'s own `<script>` tag (matching the sibling project's
single-file-per-concern convention); a handful of pure UI-support functions
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
